import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiEdit2,
  FiExternalLink,
  FiMapPin,
  FiTrash2,
  FiUpload,
  FiUsers,
} from "react-icons/fi";
import StatusBadge from "../components/StatusBadge.jsx";
import ErrorState from "../components/ErrorState.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Field from "../components/Field.jsx";
import { PageLoader } from "../components/Loader.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { useFetch } from "../hooks/useFetch.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { deleteJob, getJob } from "../services/job.service.js";
import { applyToJob, deleteApplication } from "../services/application.service.js";
import { MAX_RESUME_BYTES } from "../config.js";
import {
  alertErrorClass,
  buttonClass,
  cardClass,
  dangerButtonClass,
  inputErrorClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "../style/classes.js";
import {
  formatDate,
  formatSalary,
  getErrorMessage,
  getFieldErrors,
  isExpired,
  resumeUrl,
  timeAgo,
} from "../utils/format.js";
import { fieldProps } from "../utils/form.js";

const ApplyForm = ({ job, onApplied }) => {
  const toast = useToast();
  const [coverLetter, setCoverLetter] = useState("");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (event) => {
    const selected = event.target.files?.[0];
    setFileError("");
    setFile(null);

    if (!selected) return;
    if (selected.type !== "application/pdf" || !selected.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Resume must be a PDF file.");
      return;
    }
    if (selected.size > MAX_RESUME_BYTES) {
      setFileError("Resume must be 5 MB or smaller.");
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (!file) {
      setFileError("Please attach your resume as a PDF.");
      return;
    }

    const body = new FormData();
    body.append("resume", file);
    body.append("coverLetter", coverLetter.trim());

    setLoading(true);
    try {
      const response = await applyToJob(job._id, body);
      toast.success(response.message, "Application sent");
      onApplied();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={`${cardClass} space-y-5 p-4 sm:p-6`}>
      <div>
        <h2 className="text-lg font-semibold">Apply for this role</h2>
        <p className="mt-1 text-sm text-[#60766b]">Attach your resume and tell {job.company} why you are a great fit.</p>
      </div>

      {error && (
        <p role="alert" className={alertErrorClass}>
          {error}
        </p>
      )}

      <Field id="apply-resume" label="Resume (PDF, up to 5 MB)" error={fileError} required>
        <label
          htmlFor="apply-resume"
          className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-4 text-sm transition hover:border-[#235347] hover:bg-[#f5f8f5] ${
            fileError ? "border-red-400" : "border-[#8EB69B]"
          }`}
        >
          <FiUpload aria-hidden="true" className="shrink-0 text-[#235347]" />
          <span className="truncate text-[#163832]">{file ? file.name : "Choose a PDF file"}</span>
        </label>
        <input
          {...fieldProps("apply-resume", { error: fileError })}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFile}
          className="sr-only"
        />
      </Field>

      <Field
        id="apply-cover"
        label="Cover letter (optional)"
        error={fieldErrors.coverLetter}
        hint={`${coverLetter.length}/5000`}
      >
        <textarea
          {...fieldProps("apply-cover", { error: fieldErrors.coverLetter, hint: true })}
          value={coverLetter}
          onChange={(event) => setCoverLetter(event.target.value)}
          rows={6}
          maxLength={5000}
          placeholder="Introduce yourself and highlight relevant experience"
          className={`${textareaClass} ${fieldErrors.coverLetter ? inputErrorClass : ""}`}
        />
      </Field>

      <button type="submit" disabled={loading} className={primaryButtonClass}>
        {loading ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
};

const JobDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(() => getJob(id), [id]);
  const [confirm, setConfirm] = useState(null);
  const [working, setWorking] = useState(false);

  useDocumentTitle(data?.job?.title || "Job details");

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { job, canManage, myApplication } = data;
  const salary = formatSalary(job.salaryRange);
  const expired = isExpired(job);
  const acceptingApplications = job.status === "open" && !expired;

  const handleConfirm = async () => {
    setWorking(true);
    try {
      if (confirm === "job") {
        await deleteJob(job._id);
        toast.success("Job deleted.", "Done");
        navigate(user.role === "admin" ? "/admin/jobs" : "/employer/jobs", { replace: true });
        return;
      }
      await deleteApplication(myApplication._id);
      toast.success("Your application was withdrawn.", "Done");
      setConfirm(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err), "Action failed");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <article className="min-w-0">
        <Link to="/jobs" className="text-sm font-medium text-[#235347] hover:underline">
          ← Back to jobs
        </Link>

        <div className={`${cardClass} mt-4 p-4 sm:p-8`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{job.title}</h1>
              <p className="mt-1 text-base font-medium text-[#235347]">{job.company}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge value={job.status} />
              {expired && <StatusBadge value="closed" label="Deadline passed" />}
              <StatusBadge value="neutral" label={job.jobType} />
              <StatusBadge value="neutral" label={`${job.experienceLevel} level`} />
            </div>
          </div>

          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#60766b]">
            <li className="flex items-center gap-1.5">
              <FiMapPin aria-hidden="true" /> {job.location}
              {job.isRemote ? " · Remote friendly" : ""}
            </li>
            {salary && (
              <li className="flex items-center gap-1.5">
                <FiDollarSign aria-hidden="true" /> {salary}
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <FiClock aria-hidden="true" /> Posted {timeAgo(job.createdAt)}
            </li>
            {job.deadline && (
              <li className="flex items-center gap-1.5">
                <FiCalendar aria-hidden="true" /> Apply by {formatDate(job.deadline)}
              </li>
            )}
            {job.openings > 1 && (
              <li className="flex items-center gap-1.5">
                <FiUsers aria-hidden="true" /> {job.openings} openings
              </li>
            )}
          </ul>

          <section className="mt-8" aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-lg font-semibold">
              About the role
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#163832]">{job.description}</p>
          </section>

          <section className="mt-8" aria-labelledby="requirements-heading">
            <h2 id="requirements-heading" className="text-lg font-semibold">
              Requirements
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#163832]">
              {job.requirements.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </section>

          {job.skills?.length > 0 && (
            <section className="mt-8" aria-labelledby="skills-heading">
              <h2 id="skills-heading" className="text-lg font-semibold">
                Skills
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <li key={skill} className="rounded-lg bg-[#f5f8f5] px-3 py-1.5 text-sm font-medium text-[#163832]">
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.benefits?.length > 0 && (
            <section className="mt-8" aria-labelledby="benefits-heading">
              <h2 id="benefits-heading" className="text-lg font-semibold">
                Benefits
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#163832]">
                {job.benefits.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {job.applicationUrl && (
            <p className="mt-8 text-sm">
              <a
                href={job.applicationUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1.5 font-semibold text-[#235347] hover:underline"
              >
                Visit employer website <FiExternalLink aria-hidden="true" />
              </a>
            </p>
          )}
        </div>
      </article>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start" aria-label="Actions">
        {user.role === "candidate" && myApplication && (
          <div className={`${cardClass} space-y-4 p-4 sm:p-6`}>
            <h2 className="text-lg font-semibold">Your application</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#60766b]">Status</span>
              <StatusBadge value={myApplication.status} />
            </div>
            <p className="text-sm text-[#60766b]">Submitted {formatDate(myApplication.createdAt)}</p>
            <a
              href={resumeUrl(myApplication._id)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${secondaryButtonClass} w-full`}
            >
              View my resume
            </a>
            <button type="button" onClick={() => setConfirm("application")} className={`${secondaryButtonClass} w-full`}>
              Withdraw application
            </button>
          </div>
        )}

        {user.role === "candidate" && !myApplication && acceptingApplications && (
          <ApplyForm job={job} onApplied={reload} />
        )}

        {user.role === "candidate" && !myApplication && !acceptingApplications && (
          <div className={`${cardClass} p-4 text-sm text-[#60766b] sm:p-6`}>
            This job is no longer accepting applications.
          </div>
        )}

        {user.role === "employer" && !canManage && (
          <div className={`${cardClass} p-4 text-sm text-[#60766b] sm:p-6`}>
            Employers cannot apply to jobs. Sign in with a candidate account to apply.
          </div>
        )}

        {canManage && (
          <div className={`${cardClass} space-y-3 p-4 sm:p-6`}>
            <h2 className="text-lg font-semibold">Manage job</h2>
            <Link to={`/employer/jobs/${job._id}/applicants`} className={`${buttonClass} w-full`}>
              <FiUsers aria-hidden="true" /> View applicants
            </Link>
            <Link to={`/employer/jobs/${job._id}/edit`} className={`${secondaryButtonClass} w-full`}>
              <FiEdit2 aria-hidden="true" /> Edit job
            </Link>
            <button type="button" onClick={() => setConfirm("job")} className={`${dangerButtonClass} w-full`}>
              <FiTrash2 aria-hidden="true" /> Delete job
            </button>
          </div>
        )}

        {job.createdBy?.name && (
          <p className="px-1 text-xs text-[#52675d]">Posted by {job.createdBy.name}</p>
        )}
      </aside>

      <ConfirmDialog
        open={confirm === "job"}
        title="Delete this job?"
        message="The job and every application submitted to it will be permanently removed."
        confirmLabel="Delete job"
        loading={working}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "application"}
        title="Withdraw your application?"
        message="Your application and uploaded resume will be removed. You can apply again later if the job is still open."
        confirmLabel="Withdraw"
        loading={working}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default JobDetails;
