import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import Field from "../components/Field.jsx";
import ErrorState from "../components/ErrorState.jsx";
import { PageLoader } from "../components/Loader.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { useFetch } from "../hooks/useFetch.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { createJob, getJob, updateJob } from "../services/job.service.js";
import {
  alertErrorClass,
  buttonClass,
  cardClass,
  inputClass,
  inputErrorClass,
  secondaryButtonClass,
  textareaClass,
} from "../style/classes.js";
import { getErrorMessage, getFieldErrors, splitCommas, splitLines, toDateInput } from "../utils/format.js";
import { fieldProps } from "../utils/form.js";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
const LEVELS = ["Entry", "Mid", "Senior", "Lead"];
const STATUSES = [
  { value: "open", label: "Open — accepting applications" },
  { value: "draft", label: "Draft — hidden from candidates" },
  { value: "closed", label: "Closed — no longer hiring" },
];

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

const buildInitial = (job, user) => ({
  title: job?.title || "",
  company: job?.company || user.company || "",
  location: job?.location || "",
  jobType: job?.jobType || "Full-time",
  experienceLevel: job?.experienceLevel || "Mid",
  status: job?.status || "open",
  openings: String(job?.openings || 1),
  deadline: toDateInput(job?.deadline),
  salaryMin: job?.salaryRange?.min ?? "",
  salaryMax: job?.salaryRange?.max ?? "",
  currency: job?.salaryRange?.currency || "USD",
  category: job?.category || "",
  isRemote: Boolean(job?.isRemote),
  applicationUrl: job?.applicationUrl || "",
  description: job?.description || "",
  requirements: (job?.requirements || []).join("\n"),
  skills: (job?.skills || []).join(", "),
  benefits: (job?.benefits || []).join("\n"),
});

const JobFormFields = ({ job }) => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [values, setValues] = useState(() => buildInitial(job, user));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(job);

  const set = (name) => (event) =>
    setValues((current) => ({
      ...current,
      [name]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
    }));

  const inputProps = (name, id) => ({
    ...fieldProps(id, { error: fieldErrors[name] }),
    value: values[name],
    onChange: set(name),
    className: `${inputClass} ${fieldErrors[name] ? inputErrorClass : ""}`,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const requirements = splitLines(values.requirements);
    const errors = {};
    if (values.title.trim().length < 3) errors.title = "Job title must be at least 3 characters.";
    if (!values.company.trim()) errors.company = "Company name is required.";
    if (values.description.trim().length < 20) errors.description = "Description must be at least 20 characters.";
    if (requirements.length === 0) errors.requirements = "Add at least one requirement.";
    if (
      values.salaryMin !== "" &&
      values.salaryMax !== "" &&
      Number(values.salaryMax) < Number(values.salaryMin)
    ) {
      errors["salaryRange.max"] = "Maximum salary cannot be lower than minimum salary.";
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields.");
      return;
    }

    const payload = {
      title: values.title.trim(),
      company: values.company.trim(),
      description: values.description.trim(),
      location: values.location.trim(),
      jobType: values.jobType,
      experienceLevel: values.experienceLevel,
      status: values.status,
      category: values.category.trim(),
      isRemote: values.isRemote,
      applicationUrl: values.applicationUrl.trim(),
      openings: Number(values.openings) || 1,
      deadline: values.deadline,
      requirements,
      skills: splitCommas(values.skills),
      benefits: splitLines(values.benefits),
      salaryRange: {
        min: values.salaryMin === "" ? null : Number(values.salaryMin),
        max: values.salaryMax === "" ? null : Number(values.salaryMax),
        currency: values.currency.trim().toUpperCase() || "USD",
      },
    };

    setLoading(true);
    try {
      const response = isEdit ? await updateJob(job._id, payload) : await createJob(payload);
      toast.success(response.message, isEdit ? "Job updated" : "Job posted");
      navigate(`/jobs/${response.job._id}`, { replace: true });
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const requirementsError = fieldErrors.requirements || fieldErrors["requirements.0"];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {error && (
        <p role="alert" className={alertErrorClass}>
          {error}
        </p>
      )}

      <section className={`${cardClass} space-y-5 p-4 sm:p-8`} aria-labelledby="basics-heading">
        <h2 id="basics-heading" className="text-lg font-semibold">
          Basics
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="job-title" label="Job title" error={fieldErrors.title} required>
            <input {...inputProps("title", "job-title")} type="text" maxLength={100} placeholder="e.g. Senior Backend Engineer" />
          </Field>
          <Field id="job-company" label="Company" error={fieldErrors.company} required>
            <input {...inputProps("company", "job-company")} type="text" maxLength={100} />
          </Field>
          <Field id="job-location" label="Location" error={fieldErrors.location}>
            <input {...inputProps("location", "job-location")} type="text" maxLength={100} placeholder="City, Country or Remote" />
          </Field>
          <Field id="job-category" label="Category" error={fieldErrors.category}>
            <input {...inputProps("category", "job-category")} type="text" maxLength={50} placeholder="e.g. Engineering" />
          </Field>
          <Field id="job-type" label="Job type" error={fieldErrors.jobType}>
            <select {...inputProps("jobType", "job-type")}>
              {JOB_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field id="job-level" label="Experience level" error={fieldErrors.experienceLevel}>
            <select {...inputProps("experienceLevel", "job-level")}>
              {LEVELS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field id="job-openings" label="Openings" error={fieldErrors.openings}>
            <input {...inputProps("openings", "job-openings")} type="number" min="1" max="10000" />
          </Field>
          <Field id="job-deadline" label="Application deadline" error={fieldErrors.deadline} hint="Leave empty for no deadline">
            <input {...inputProps("deadline", "job-deadline")} type="date" min={tomorrow()} />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#163832]">
          <input
            type="checkbox"
            checked={values.isRemote}
            onChange={set("isRemote")}
            className="h-4 w-4 rounded accent-[#235347]"
          />
          Remote friendly
        </label>
      </section>

      <section className={`${cardClass} space-y-5 p-4 sm:p-8`} aria-labelledby="compensation-heading">
        <h2 id="compensation-heading" className="text-lg font-semibold">
          Compensation
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field id="job-salary-min" label="Minimum salary" error={fieldErrors["salaryRange.min"]}>
            <input {...inputProps("salaryMin", "job-salary-min")} type="number" min="0" />
          </Field>
          <Field id="job-salary-max" label="Maximum salary" error={fieldErrors["salaryRange.max"]}>
            <input {...inputProps("salaryMax", "job-salary-max")} type="number" min="0" />
          </Field>
          <Field id="job-currency" label="Currency" error={fieldErrors["salaryRange.currency"]}>
            <input {...inputProps("currency", "job-currency")} type="text" maxLength={3} placeholder="USD" />
          </Field>
        </div>
      </section>

      <section className={`${cardClass} space-y-5 p-4 sm:p-8`} aria-labelledby="details-heading">
        <h2 id="details-heading" className="text-lg font-semibold">
          Details
        </h2>
        <Field id="job-description" label="Description" error={fieldErrors.description} required>
          <textarea
            {...fieldProps("job-description", { error: fieldErrors.description })}
            value={values.description}
            onChange={set("description")}
            rows={8}
            maxLength={8000}
            placeholder="Describe the role, team and impact"
            className={`${textareaClass} ${fieldErrors.description ? inputErrorClass : ""}`}
          />
        </Field>
        <Field id="job-requirements" label="Requirements" error={requirementsError} hint="One requirement per line" required>
          <textarea
            {...fieldProps("job-requirements", { error: requirementsError, hint: true })}
            value={values.requirements}
            onChange={set("requirements")}
            rows={5}
            className={`${textareaClass} ${requirementsError ? inputErrorClass : ""}`}
          />
        </Field>
        <Field id="job-skills" label="Skills" error={fieldErrors.skills} hint="Separate skills with commas">
          <input {...inputProps("skills", "job-skills")} type="text" placeholder="React, Node.js, MongoDB" />
        </Field>
        <Field id="job-benefits" label="Benefits" error={fieldErrors.benefits} hint="One benefit per line">
          <textarea
            {...fieldProps("job-benefits", { error: fieldErrors.benefits, hint: true })}
            value={values.benefits}
            onChange={set("benefits")}
            rows={4}
            className={textareaClass}
          />
        </Field>
        <Field id="job-url" label="Employer website" error={fieldErrors.applicationUrl} hint="Optional. Must start with https://">
          <input {...inputProps("applicationUrl", "job-url")} type="url" placeholder="https://example.com/careers" />
        </Field>
      </section>

      <section className={`${cardClass} space-y-5 p-4 sm:p-8`} aria-labelledby="visibility-heading">
        <h2 id="visibility-heading" className="text-lg font-semibold">
          Visibility
        </h2>
        <Field id="job-status" label="Status" error={fieldErrors.status}>
          <select {...inputProps("status", "job-status")}>
            {STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <Link to={isEdit ? `/jobs/${job._id}` : "/employer/jobs"} className={secondaryButtonClass}>
          Cancel
        </Link>
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Saving…" : isEdit ? "Save changes" : "Publish job"}
        </button>
      </div>
    </form>
  );
};

const JobForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocumentTitle(isEdit ? "Edit job" : "Post a job");
  const { data, loading, error, reload } = useFetch(
    () => (isEdit ? getJob(id) : Promise.resolve(null)),
    [id],
  );

  return (
    <>
      <PageHeader
        eyebrow="Employer"
        title={isEdit ? "Edit job" : "Post a new job"}
        description="Clear, specific listings attract better candidates."
      />
      {loading && <PageLoader />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && <JobFormFields key={id || "new"} job={data?.job} />}
    </>
  );
};

export default JobForm;
