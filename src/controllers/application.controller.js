import path from "path";
import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import User from "../models/auth.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { asString, countsByKey, pageMeta, parsePagination } from "../utils/query.js";
import { RESUME_DIR, isPdfFile, removeFile, safeDisplayName } from "../utils/files.js";
import {
  sendApplicationStatusEmail,
  sendNewApplicationEmail,
} from "../services/mail.service.js";

const STATUSES = ["Pending", "Accepted", "Rejected"];

const ownerId = (job) => String(job.createdBy?._id || job.createdBy);

const canManageJob = (user, job) => user.role === "admin" || ownerId(job) === String(user._id);

export const applyJob = asyncHandler(async (req, res) => {
  const uploaded = req.file?.filename;
  let saved = false;

  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) throw new ApiError(404, "Job not found");
    if (job.status !== "open") {
      throw new ApiError(400, "This job is not accepting applications");
    }
    if (job.deadline && job.deadline < new Date()) {
      throw new ApiError(400, "The application deadline has passed");
    }
    if (!uploaded) throw new ApiError(400, "Please attach your resume as a PDF");
    if (!(await isPdfFile(uploaded))) {
      throw new ApiError(400, "The uploaded file is not a valid PDF");
    }
    if (await Application.exists({ user: req.user._id, job: job._id })) {
      throw new ApiError(409, "You have already applied for this job");
    }

    let application;
    try {
      application = await Application.create({
        user: req.user._id,
        job: job._id,
        resume: uploaded,
        resumeOriginalName: safeDisplayName(req.file.originalname),
        coverLetter: req.body.coverLetter,
      });
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError(409, "You have already applied for this job");
      }
      throw error;
    }

    saved = true;

    User.findById(job.createdBy)
      .select("name email")
      .then((employer) => employer && sendNewApplicationEmail(employer, job, req.user))
      .catch((error) => console.error(`Employer email failed: ${error.message}`));

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application,
    });
  } finally {
    if (!saved) await removeFile(uploaded);
  }
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 10, 50);
  const filter = { user: req.user._id };

  const status = asString(req.query.status);
  if (STATUSES.includes(status)) filter.status = status;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate("job", "title company location jobType status deadline")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    ...pageMeta(total, page, limit),
    applications,
  });
});

export const getJobApplicants = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId).select("title company status createdBy");

  if (!job) throw new ApiError(404, "Job not found");
  if (!canManageJob(req.user, job)) {
    throw new ApiError(403, "You are not authorized to view these applicants");
  }

  const { page, limit, skip } = parsePagination(req.query, 10, 50);
  const filter = { job: job._id };

  const status = asString(req.query.status);
  if (STATUSES.includes(status)) filter.status = status;

  const [applicants, total, counts] = await Promise.all([
    Application.find(filter)
      .populate("user", "name email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(filter),
    Application.aggregate([
      { $match: { job: job._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    job: { _id: job._id, title: job.title, company: job.company, status: job.status },
    counts: countsByKey(counts),
    ...pageMeta(total, page, limit),
    applicants,
  });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate("job", "title company createdBy")
    .populate("user", "name email");

  if (!application || !application.job) {
    throw new ApiError(404, "Application not found");
  }

  if (!canManageJob(req.user, application.job)) {
    throw new ApiError(403, "You are not authorized to update this application");
  }

  const previous = application.status;
  application.status = req.body.status;
  await application.save();

  if (previous !== application.status && application.status !== "Pending" && application.user) {
    sendApplicationStatusEmail(application.user, application.job, application.status).catch(
      (error) => console.error(`Status email failed: ${error.message}`),
    );
  }

  res.status(200).json({
    success: true,
    message: `Application marked as ${application.status}`,
    application,
  });
});

export const deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);

  if (!application) throw new ApiError(404, "Application not found");

  const isOwner = String(application.user) === String(req.user._id);
  if (!isOwner && req.user.role !== "admin") {
    throw new ApiError(403, "You are not authorized to delete this application");
  }

  await removeFile(application.resume);
  await application.deleteOne();

  res.status(200).json({ success: true, message: "Application removed successfully" });
});

export const downloadResume = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate("job", "createdBy");

  if (!application || !application.resume) {
    throw new ApiError(404, "Resume not found");
  }

  const isApplicant = String(application.user) === String(req.user._id);
  const isManager = application.job && canManageJob(req.user, application.job);

  if (!isApplicant && !isManager) {
    throw new ApiError(403, "You are not authorized to view this resume");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${safeDisplayName(application.resumeOriginalName)}"`,
  );

  res.sendFile(path.basename(application.resume), { root: RESUME_DIR, dotfiles: "deny" }, (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({ success: false, message: "Resume file is missing" });
    }
  });
});
