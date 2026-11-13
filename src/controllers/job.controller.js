import Job, { JOB_TYPES, EXPERIENCE_LEVELS, JOB_STATUSES } from "../models/job.model.js";
import Application from "../models/application.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { asString, countsByKey, pageMeta, parsePagination } from "../utils/query.js";
import { deleteJobsCascade } from "../services/cleanup.service.js";

const JOB_FIELDS = [
  "title",
  "company",
  "description",
  "requirements",
  "location",
  "jobType",
  "salaryRange",
  "experienceLevel",
  "deadline",
  "status",
  "skills",
  "benefits",
  "applicationUrl",
  "isRemote",
  "category",
  "openings",
];

const pickJobFields = (body) =>
  JOB_FIELDS.reduce((accumulator, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      accumulator[field] = body[field];
    }
    return accumulator;
  }, {});

const ownerId = (job) => String(job.createdBy?._id || job.createdBy);

const canManage = (user, job) => user.role === "admin" || ownerId(job) === String(user._id);

const openFilter = () => ({
  status: "open",
  $or: [{ deadline: null }, { deadline: { $gt: new Date() } }],
});

const withApplicantCounts = async (jobs) => {
  const ids = jobs.map((job) => job._id);
  const rows = await Application.aggregate([
    { $match: { job: { $in: ids } } },
    {
      $group: {
        _id: "$job",
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
      },
    },
  ]);

  const map = new Map(rows.map((row) => [String(row._id), row]));

  return jobs.map((job) => {
    const row = map.get(String(job._id));
    return {
      ...job.toObject(),
      applicantsCount: row?.total || 0,
      pendingCount: row?.pending || 0,
    };
  });
};

export const createJob = asyncHandler(async (req, res) => {
  const data = pickJobFields(req.body);
  data.company = data.company || req.user.company;

  if (!data.company) {
    throw new ApiError(400, "Company name is required");
  }

  const job = await Job.create({ ...data, createdBy: req.user._id });

  res.status(201).json({ success: true, message: "Job created successfully", job });
});

export const getAllJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 10, 50);
  const conditions = [];

  if (req.user.role === "admin") {
    const status = asString(req.query.status);
    if (JOB_STATUSES.includes(status)) {
      conditions.push({ status });
    }
  } else {
    conditions.push(openFilter());
  }

  const q = asString(req.query.q).slice(0, 100);
  if (q) {
    const searchTerms = q.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    conditions.push(searchTerms ? { $text: { $search: searchTerms } } : { _id: null });
  }

  const jobType = asString(req.query.jobType);
  if (JOB_TYPES.includes(jobType)) conditions.push({ jobType });

  const experienceLevel = asString(req.query.experienceLevel);
  if (EXPERIENCE_LEVELS.includes(experienceLevel)) conditions.push({ experienceLevel });

  if (asString(req.query.remote) === "true") conditions.push({ isRemote: true });

  const filter = conditions.length ? { $and: conditions } : {};
  const sort =
    asString(req.query.sort) === "oldest"
      ? { createdAt: 1, _id: 1 }
      : { createdAt: -1, _id: -1 };

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate("createdBy", "name company")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: jobs.length,
    ...pageMeta(total, page, limit),
    jobs,
  });
});

export const getMyJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 10, 50);
  const filter = { createdBy: req.user._id };

  const status = asString(req.query.status);
  if (JOB_STATUSES.includes(status)) filter.status = status;

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Job.countDocuments(filter),
  ]);

  let stats;
  if (asString(req.query.stats) === "true") {
    const [jobRows, ids] = await Promise.all([
      Job.aggregate([
        { $match: { createdBy: req.user._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Job.find({ createdBy: req.user._id }).distinct("_id"),
    ]);
    const applicationRows = await Application.aggregate([
      { $match: { job: { $in: ids } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    stats = { jobs: countsByKey(jobRows), applications: countsByKey(applicationRows) };
  }

  res.status(200).json({
    success: true,
    ...pageMeta(total, page, limit),
    jobs: await withApplicantCounts(jobs),
    stats,
  });
});

export const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate("createdBy", "name company");

  if (!job || (job.status !== "open" && !canManage(req.user, job))) {
    throw new ApiError(404, "Job not found");
  }

  let myApplication = null;
  if (req.user.role === "candidate") {
    myApplication = await Application.findOne({ user: req.user._id, job: job._id });
  }

  res.status(200).json({
    success: true,
    job,
    canManage: canManage(req.user, job),
    myApplication,
  });
});

export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (!canManage(req.user, job)) {
    throw new ApiError(403, "You are not authorized to modify this job");
  }

  const data = pickJobFields(req.body);
  if (!data.company) data.company = job.company;

  job.set(data);
  await job.save();

  res.status(200).json({ success: true, message: "Job updated successfully", job });
});

export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (!canManage(req.user, job)) {
    throw new ApiError(403, "You are not authorized to delete this job");
  }

  await deleteJobsCascade([job._id]);

  res.status(200).json({ success: true, message: "Job deleted successfully" });
});
