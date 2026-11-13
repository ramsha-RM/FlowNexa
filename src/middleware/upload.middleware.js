import multer from "multer";
import crypto from "crypto";
import path from "path";
import ApiError from "../utils/apiError.js";
import { RESUME_DIR } from "../utils/files.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, RESUME_DIR),
  filename: (req, file, cb) => cb(null, `${crypto.randomBytes(16).toString("hex")}.pdf`),
});

const fileFilter = (req, file, cb) => {
  const isPdf =
    file.mimetype === "application/pdf" &&
    path.extname(file.originalname).toLowerCase() === ".pdf";

  if (!isPdf) {
    return cb(new ApiError(400, "Resume must be a PDF file"));
  }
  cb(null, true);
};

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 10 },
}).single("resume");
