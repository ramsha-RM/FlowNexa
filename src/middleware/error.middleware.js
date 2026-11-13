import ApiError from "../utils/apiError.js";

export const notFound = (req, res, next) => next(new ApiError(404, "Route not found"));

export const errorMiddleware = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.code === 11000) {
    status = 409;
    message = `A record with this ${Object.keys(err.keyPattern || {}).join(", ") || "value"} already exists`;
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.name === "ValidationError" && err.errors) {
    status = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  } else if (err.name === "MulterError") {
    status = 400;
    message =
      err.code === "LIMIT_FILE_SIZE" ? "Resume must be 5 MB or smaller" : "Invalid file upload";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed request body";
  } else if (err.type === "entity.too.large") {
    status = 413;
    message = "Request body is too large";
  }

  if (status >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === "production") {
      message = "Internal server error";
    }
  }

  if (res.headersSent) {
    return next(err);
  }

  return res.status(status).json({ success: false, message });
};
