import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import jobRoutes from "./routes/job.route.js";
import applicationRoutes from "./routes/application.route.js";
import adminRoutes from "./routes/admin.route.js";
import mockRoutes from "./routes/mock.route.js";
import { getDBStatus } from "./config/db.js";
import { csrfGuard } from "./middleware/csrf.middleware.js";
import { sanitizeBody } from "./middleware/sanitize.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import { errorMiddleware, notFound } from "./middleware/error.middleware.js";

const app = express();

app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);

const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = [
  ...(process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  ...(isProduction ? [] : ["http://localhost:5173"]),
];

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "X-Requested-With"],
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(sanitizeBody);

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "FlowNexa API is running" });
});

app.get("/health", (req, res) => {
  const db = getDBStatus();
  res.status(db.connected ? 200 : 503).json({
    success: db.connected,
    status: db.connected ? "ok" : "database unavailable",
  });
});

app.use("/api", (req, res, next) => {
  if (getDBStatus().connected) return next();
  return res.status(503).json({
    success: false,
    message: "Service is temporarily unavailable. Please try again shortly.",
  });
});

app.use("/api", apiLimiter);
app.use("/api", csrfGuard);

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes);

if (!isProduction || process.env.ENABLE_MOCK_API === "true") {
  app.use("/api/mock", mockRoutes);
}

app.use(notFound);
app.use(errorMiddleware);

export default app;
