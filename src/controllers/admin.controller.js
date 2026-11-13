import User from "../models/auth.model.js";
import Job from "../models/job.model.js";
import Application from "../models/application.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  asString,
  countsByKey,
  escapeRegex,
  pageMeta,
  parsePagination,
} from "../utils/query.js";
import { deleteApplicationsWhere, deleteJobsCascade } from "../services/cleanup.service.js";

const ROLES = ["admin", "candidate", "employer"];

export const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 10, 50);
  const filter = {};

  const role = asString(req.query.role);
  if (ROLES.includes(role)) filter.role = role;

  const q = asString(req.query.q).slice(0, 100);
  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: pattern }, { email: pattern }, { company: pattern }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    ...pageMeta(total, page, limit),
    users: users.map((user) => user.toPublic()),
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, "You cannot change your own role");
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  if (user.role === "admin" && req.body.role !== "admin") {
    const admins = await User.countDocuments({ role: "admin" });
    if (admins <= 1) throw new ApiError(400, "At least one admin must remain");
  }

  user.role = req.body.role;
  if (user.role === "employer" && !user.company) {
    user.company = user.name;
  }
  await user.save();

  res.status(200).json({ success: true, message: "Role updated", user: user.toPublic() });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, "You cannot delete your own account");
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  if (user.role === "admin") {
    const admins = await User.countDocuments({ role: "admin" });
    if (admins <= 1) throw new ApiError(400, "At least one admin must remain");
  }

  const jobs = await Job.find({ createdBy: user._id }).select("_id");
  await deleteJobsCascade(jobs.map((job) => job._id));
  await deleteApplicationsWhere({ user: user._id });
  await user.deleteOne();

  res.status(200).json({ success: true, message: "User and related data deleted" });
});

export const getAllApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 10, 50);
  const filter = {};

  const status = asString(req.query.status);
  if (["Pending", "Accepted", "Rejected"].includes(status)) filter.status = status;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate("user", "name email")
      .populate("job", "title company")
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

export const getStats = asyncHandler(async (req, res) => {
  const [users, jobs, applications, recentUsers] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Job.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Application.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.find().sort({ createdAt: -1 }).limit(5),
  ]);

  res.status(200).json({
    success: true,
    users: countsByKey(users),
    jobs: countsByKey(jobs),
    applications: countsByKey(applications),
    recentUsers: recentUsers.map((user) => user.toPublic()),
  });
});