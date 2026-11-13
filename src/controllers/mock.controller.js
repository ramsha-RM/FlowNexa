import asyncHandler from "../utils/asyncHandler.js";
import { asString } from "../utils/query.js";
import { buildMockJobs, generateMockJobs } from "../utils/seedjobs.js";

const MAX_COUNT = 50;

const parseCount = (value) =>
  Math.min(Math.max(parseInt(asString(String(value ?? "")), 10) || 10, 1), MAX_COUNT);

export const previewMockJobs = asyncHandler(async (req, res) => {
  const count = parseCount(req.query.count);
  const jobs = buildMockJobs(count, req.user._id).map((job, index) => ({
    ...job,
    _id: `mock-${Date.now()}-${index}`,
    applicantsCount: 0,
    pendingCount: 0,
  }));

  res.status(200).json({ success: true, total: jobs.length, jobs });
});

export const seedMockJobs = asyncHandler(async (req, res) => {
  const count = parseCount(req.body?.count);
  const jobs = await generateMockJobs(count, req.user._id);

  res.status(201).json({
    success: true,
    message: `${jobs.length} mock jobs created`,
    total: jobs.length,
    jobs,
  });
});