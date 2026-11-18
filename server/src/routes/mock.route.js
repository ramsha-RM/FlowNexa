import express from "express";
import { previewMockJobs, seedMockJobs } from "../controllers/mock.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/jobs", previewMockJobs);
router.post("/jobs/seed", authorize("admin"), seedMockJobs);

export default router;