import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";

const missing = ["MONGO_URI", "JWT_SECRET"].filter((key) => !process.env[key]);
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  for (const key of ["CLIENT_URL", "SMTP_HOST", "MAIL_FROM", "RESUME_STORAGE_DIR"]) {
    if (!process.env[key]?.trim()) missing.push(key);
  }
}

if (missing.length) {
  console.error(`Missing environment variables: ${[...new Set(missing)].join(", ")}`);
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be at least 32 characters long");
  process.exit(1);
}

if (isProduction) {
  const mailFrom = process.env.MAIL_FROM.trim();
  const address = mailFrom.match(/<([^<>]+)>/)?.[1] || mailFrom;
  const domain = address.split("@")[1]?.toLowerCase();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ||
    domain === "localhost" ||
    domain.endsWith(".local")
  ) {
    console.error("MAIL_FROM must be a valid email address on a non-local domain in production");
    process.exit(1);
  }
}

const smtpPort = process.env.SMTP_PORT;
if (smtpPort && (!/^\d+$/.test(smtpPort) || Number(smtpPort) < 1 || Number(smtpPort) > 65535)) {
  console.error("SMTP_PORT must be an integer between 1 and 65535");
  process.exit(1);
}

if (Boolean(process.env.SMTP_USER?.trim()) !== Boolean(process.env.SMTP_PASS?.trim())) {
  console.error("SMTP_USER and SMTP_PASS must be configured together");
  process.exit(1);
}

if (
  process.env.SMTP_SECURE &&
  !["true", "false"].includes(process.env.SMTP_SECURE.toLowerCase())
) {
  console.error("SMTP_SECURE must be true or false");
  process.exit(1);
}

const connectWithRetry = async () => {
  const connection = await connectDB();
  if (!connection) {
    setTimeout(connectWithRetry, 10000);
  }
};

connectWithRetry();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});