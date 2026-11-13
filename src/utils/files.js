import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const RESUME_DIR = path.resolve(
  process.env.RESUME_STORAGE_DIR || path.resolve(currentDir, "../../uploads/resumes"),
);

fs.mkdirSync(RESUME_DIR, { recursive: true });

export const removeFile = async (name) => {
  if (!name) return;
  try {
    await fs.promises.unlink(path.join(RESUME_DIR, path.basename(name)));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};

export const isPdfFile = async (name) => {
  const handle = await fs.promises.open(path.join(RESUME_DIR, path.basename(name)), "r");
  try {
    const buffer = Buffer.alloc(5);
    await handle.read(buffer, 0, 5, 0);
    return buffer.toString("latin1") === "%PDF-";
  } finally {
    await handle.close();
  }
};

export const safeDisplayName = (name) =>
  String(name || "resume.pdf")
    .replace(/[^\w.\- ]+/g, "_")
    .slice(0, 100);
