const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const csrfGuard = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  if (req.get("x-requested-with") !== "XMLHttpRequest") {
    return res.status(403).json({ success: false, message: "Invalid request origin" });
  }

  next();
};
