const clean = (value) => {
  if (Array.isArray(value)) {
    return value.map(clean);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith("$") && !key.includes("."))
        .map(([key, nested]) => [key, clean(nested)]),
    );
  }

  return value;
};

export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = clean(req.body);
  }
  next();
};
