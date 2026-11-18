import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import { removeFile } from "../utils/files.js";

export const deleteApplicationsWhere = async (filter) => {
  const applications = await Application.find(filter).select("resume");
  await Promise.all(applications.map((application) => removeFile(application.resume)));
  await Application.deleteMany(filter);
};

export const deleteJobsCascade = async (jobIds) => {
  if (!jobIds.length) return;
  await deleteApplicationsWhere({ job: { $in: jobIds } });
  await Job.deleteMany({ _id: { $in: jobIds } });
};
