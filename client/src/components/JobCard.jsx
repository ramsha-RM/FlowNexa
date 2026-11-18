import { Link } from "react-router-dom";
import { FiClock, FiDollarSign, FiMapPin } from "react-icons/fi";
import StatusBadge from "./StatusBadge.jsx";
import { cardClass } from "../style/classes.js";
import { formatDate, formatSalary, isExpired, timeAgo } from "../utils/format.js";

const JobCard = ({ job }) => {
  const salary = formatSalary(job.salaryRange);
  const expired = isExpired(job);

  return (
    <article
      className={`${cardClass} relative p-5 transition hover:border-[#8EB69B] hover:shadow-[0_16px_48px_rgba(5,31,32,0.10)] sm:p-6`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-[#051F20]">
            <Link
              to={`/jobs/${job._id}`}
              className="after:absolute after:inset-0 after:content-[''] hover:underline"
            >
              {job.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm font-medium text-[#235347]">
            {job.company}
            {job.createdBy?.name && job.createdBy.company !== job.company ? ` · ${job.createdBy.name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {job.status !== "open" && <StatusBadge value={job.status} />}
          {expired && <StatusBadge value="closed" label="Deadline passed" />}
          <StatusBadge value="neutral" label={job.jobType} />
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#52675d]">
        {job.location && (
          <li className="flex items-center gap-1.5">
            <FiMapPin aria-hidden="true" /> {job.location}
            {job.isRemote ? " · Remote friendly" : ""}
          </li>
        )}
        {salary && (
          <li className="flex items-center gap-1.5">
            <FiDollarSign aria-hidden="true" /> {salary}
          </li>
        )}
        <li className="flex items-center gap-1.5">
          <FiClock aria-hidden="true" /> Posted {timeAgo(job.createdAt)}
        </li>
      </ul>

      {job.skills?.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Skills">
          {job.skills.slice(0, 6).map((skill) => (
            <li
              key={skill}
              className="rounded-lg bg-[#f5f8f5] px-2.5 py-1 text-xs font-medium text-[#163832]"
            >
              {skill}
            </li>
          ))}
        </ul>
      )}

      {job.deadline && !expired && (
        <p className="mt-4 text-xs text-[#52675d]">Apply by {formatDate(job.deadline)}</p>
      )}
    </article>
  );
};

export default JobCard;
