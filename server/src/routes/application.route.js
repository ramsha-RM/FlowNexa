import express from "express";
import {
  applyJob,
  deleteApplication,
  downloadResume,
  getJobApplicants,
  getMyApplications,
  updateApplicationStatus,
} from "../controllers/application.controller.js";
import { protect, requireVerified } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { uploadResume } from "../middleware/upload.middleware.js";
import {
  applicationApplyValidator,
  applicationStatusValidator,
  idValidator,
  jobIdValidator,
  listQueryValidator,
  validate,
} from "../middleware/validation.middleware.js";

const router = express.Router();

router.use(protect);

router.post(
  "/apply/:jobId",
  authorize("candidate"),
  requireVerified,
  jobIdValidator,
  validate,
  uploadResume,
  applicationApplyValidator,
  validate,
  applyJob,
);

router.get("/my-applications", authorize("candidate"), listQueryValidator, validate, getMyApplications);

router.get(
  "/job/:jobId",
  authorize("employer", "admin"),
  jobIdValidator,
  listQueryValidator,
  validate,
  getJobApplicants,
);

router.get("/:id/resume", idValidator, validate, downloadResume);

router.put(
  "/:id/status",
  authorize("employer", "admin"),
  idValidator,
  applicationStatusValidator,
  validate,
  updateApplicationStatus,
);

router.delete("/:id", authorize("candidate", "admin"), idValidator, validate, deleteApplication);

export default router;
