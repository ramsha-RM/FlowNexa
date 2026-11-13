import express from "express";
import {
  changePassword,
  forgotPassword,
  getMe,
  googleCallback,
  googleLogin,
  login,
  logout,
  register,
  resendVerification,
  resetPassword,
  updateProfile,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  authLimiter,
  emailLimiter,
  loginLimiter,
} from "../middleware/rateLimit.middleware.js";
import {
  changePasswordValidator,
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  updateProfileValidator,
  validate,
  verifyEmailValidator,
} from "../middleware/validation.middleware.js";

const router = express.Router();

router.post("/register", authLimiter, registerValidator, validate, register);
router.post("/login", loginLimiter, loginValidator, validate, login);
router.post("/logout", logout);

router.post("/forgot-password", emailLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post("/reset-password", authLimiter, resetPasswordValidator, validate, resetPassword);
router.post("/verify-email", authLimiter, verifyEmailValidator, validate, verifyEmail);

router.get("/google-login", authLimiter, googleLogin);
router.get("/google-callback", authLimiter, googleCallback);

router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfileValidator, validate, updateProfile);
router.put("/change-password", protect, changePasswordValidator, validate, changePassword);
router.post("/resend-verification", protect, emailLimiter, resendVerification);

export default router;
