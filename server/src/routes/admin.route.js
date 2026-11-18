import express from "express";
import {
  deleteUser,
  getAllApplications,
  getAllUsers,
  getStats,
  updateUserRole,
} from "../controllers/admin.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import {
  idValidator,
  listQueryValidator,
  roleValidator,
  validate,
} from "../middleware/validation.middleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/stats", getStats);
router.get("/users", listQueryValidator, validate, getAllUsers);
router.put("/users/:id/role", idValidator, roleValidator, validate, updateUserRole);
router.delete("/users/:id", idValidator, validate, deleteUser);
router.get("/applications", listQueryValidator, validate, getAllApplications);

export default router;
