import rateLimit from "express-rate-limit";
import MongoRateLimitStore from "./mongoRateLimitStore.js";

const sharedStoreEnabled =
  process.env.NODE_ENV === "production" || process.env.RATE_LIMIT_STORE === "mongo";

const build = (scope, options) =>
  rateLimit({
    standardHeaders: "draft-7",
    legacyHeaders: false,
    ...(sharedStoreEnabled ? { store: new MongoRateLimitStore(scope) } : {}),
    handler: (req, res) =>
      res.status(429).json({
        success: false,
        message: "Too many requests. Please wait a moment and try again.",
      }),
    ...options,
  });

export const apiLimiter = build("api", { windowMs: 15 * 60 * 1000, limit: 600 });

export const authLimiter = build("auth", { windowMs: 15 * 60 * 1000, limit: 30 });

export const loginLimiter = build("login", {
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
});

export const emailLimiter = build("email", { windowMs: 60 * 60 * 1000, limit: 6 });
