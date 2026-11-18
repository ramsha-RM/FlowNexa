import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job reference is required"],
    },
    resume: {
      type: String,
      trim: true,
      default: "",
    },
    resumeOriginalName: {
      type: String,
      trim: true,
      default: "resume.pdf",
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: {
        values: ["Pending", "Accepted", "Rejected"],
        message: "{VALUE} is not a valid status",
      },
      default: "Pending",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (doc, ret) => {
        ret.hasResume = Boolean(ret.resume);
        delete ret.resume;
        return ret;
      },
    },
  },
);

applicationSchema.index({ user: 1, job: 1 }, { unique: true });
applicationSchema.index({ job: 1, status: 1, createdAt: -1 });
applicationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Application", applicationSchema);
