import mongoose from "mongoose";

export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
export const EXPERIENCE_LEVELS = ["Entry", "Mid", "Senior", "Lead"];
export const JOB_STATUSES = ["open", "closed", "draft"];

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a job title"],
      trim: true,
      maxlength: [100, "Job title cannot exceed 100 characters"],
    },
    company: {
      type: String,
      required: [true, "Please provide a company name"],
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a job description"],
      trim: true,
      maxlength: [8000, "Description cannot exceed 8000 characters"],
    },
    requirements: {
      type: [String],
      required: [true, "Please list required skills/qualifications"],
    },
    location: {
      type: String,
      trim: true,
      default: "Remote",
      maxlength: 100,
    },
    jobType: {
      type: String,
      enum: JOB_TYPES,
      default: "Full-time",
    },
    salaryRange: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: "USD", uppercase: true, trim: true },
    },
    experienceLevel: {
      type: String,
      enum: EXPERIENCE_LEVELS,
      default: "Mid",
    },
    status: {
      type: String,
      enum: JOB_STATUSES,
      default: "open",
    },
    skills: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    applicationUrl: { type: String, trim: true, default: "" },
    isRemote: { type: Boolean, default: false },
    category: { type: String, trim: true, default: "" },
    openings: { type: Number, min: 1, default: 1 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deadline: {
      type: Date,
      validate: {
        validator: function (value) {
          return !value || value > new Date();
        },
        message: "Deadline must be a future date",
      },
    },
  },
  { timestamps: true },
);

JobSchema.index({ status: 1, createdAt: -1, _id: -1 });
JobSchema.index({ createdBy: 1, createdAt: -1, _id: -1 });
JobSchema.index({ createdAt: -1, _id: -1 });
JobSchema.index(
  { title: "text", company: "text", location: "text", skills: "text", category: "text" },
  { weights: { title: 10, company: 5, location: 3, skills: 2, category: 1 }, name: "job_search" },
);

export default mongoose.model("Job", JobSchema);
