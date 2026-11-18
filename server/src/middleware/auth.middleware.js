import jwt from "jsonwebtoken";
import User from "../models/auth.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { COOKIE_NAME } from "../utils/token.js";

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    throw new ApiError(401, "Please sign in to continue");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Your session has expired. Please sign in again");
  }

  const user = await User.findById(decoded.id).select("+passwordChangedAt");

  if (!user) {
    throw new ApiError(401, "This account no longer exists");
  }

  if (
    user.passwordChangedAt &&
    decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
  ) {
    throw new ApiError(401, "Your password was changed. Please sign in again");
  }

  req.user = user;
  next();
});

export const requireVerified = (req, res, next) => {
  if (process.env.REQUIRE_EMAIL_VERIFICATION === "true" && !req.user.isEmailVerified) {
    return next(new ApiError(403, "Please verify your email address first"));
  }
  next();
};
