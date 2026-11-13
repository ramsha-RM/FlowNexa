import ApiError from "../utils/apiError.js";

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to do this"));
    }
    next();
  };
