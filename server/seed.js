import "dotenv/config";
import mongoose from "mongoose";
import User from "./src/models/auth.model.js";
import { generateMockJobs } from "./src/utils/seedjobs.js";

const count = Number(process.argv[3]) || 10;
const email = process.argv[2];

if (!email) {
  console.error("Usage: node seed.js <employer-email> [count]");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI, { family: 4 });

const employer = await User.findOne({ email: email.toLowerCase(), role: "employer" });

if (!employer) {
  console.error("No employer found with that email");
  await mongoose.disconnect();
  process.exit(1);
}

await generateMockJobs(count, employer._id);
await mongoose.disconnect();