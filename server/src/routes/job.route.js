import express from "express";
import {
  createJob,
  deleteJob,
  getAllJobs,
  getJobById,
  getMyJobs,
  updateJob,
} from "../controllers/job.controller.js";
import { protect, requireVerified } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import {
  idValidator,
  jobValidator,
  listQueryValidator,
  validate,
} from "../middleware/validation.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", listQueryValidator, validate, getAllJobs);
router.get("/mine", authorize("employer"), listQueryValidator, validate, getMyJobs);
router.get("/:id", idValidator, validate, getJobById);

router.post("/", authorize("employer"), requireVerified, jobValidator, validate, createJob);
router.put("/:id", authorize("employer", "admin"), idValidator, jobValidator, validate, updateJob);
router.delete("/:id", authorize("employer", "admin"), idValidator, validate, deleteJob);

export default router;
