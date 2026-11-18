import { useState } from "react";
import { Link } from "react-router-dom";
import { FiBriefcase, FiEdit2, FiPlus, FiTrash2, FiUsers } from "react-icons/fi";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Pagination from "../components/Pagination.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { PageLoader } from "../components/Loader.jsx";
import { useToast } from "../hooks/useToast.js";
import { useFetch } from "../hooks/useFetch.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { deleteJob, getJobs, getMyJobs } from "../services/job.service.js";
import { buttonClass, cardClass, inputClass, secondaryButtonClass } from "../style/classes.js";
import { formatDate, getErrorMessage } from "../utils/format.js";

const STATUSES = ["open", "closed", "draft"];

const ManageJobs = ({ admin = false }) => {
  useDocumentTitle(admin ? "All jobs" : "My jobs");
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [target, setTarget] = useState(null);
  const [working, setWorking] = useState(false);

  const { data, loading, error, reload } = useFetch(
    () => (admin ? getJobs({ page, status, limit: 10 }) : getMyJobs({ page, status, limit: 10 })),
    [page, status, admin],
  );

  const handleDelete = async () => {
    setWorking(true);
    try {
      await deleteJob(target._id);
      toast.success("Job deleted.", "Done");
      setTarget(null);
      if (data.jobs.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      toast.error(getErrorMessage(err), "Could not delete job");
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={admin ? "Administration" : "Employer"}
        title={admin ? "All jobs" : "My jobs"}
        description={
          admin
            ? "Review and moderate every job on the platform."
            : "Create, edit and track the roles you are hiring for."
        }
        actions={
          <>
            <div>
              <label htmlFor="job-status" className="sr-only">
                Filter by status
              </label>
              <select
                id="job-status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                className={`${inputClass} h-10`}
              >
                <option value="">All statuses</option>
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item[0].toUpperCase() + item.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            {!admin && (
              <Link to="/employer/jobs/new" className={buttonClass}>
                <FiPlus aria-hidden="true" /> Post a job
              </Link>
            )}
          </>
        }
      />

      {loading && <PageLoader />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data &&
        (data.jobs.length === 0 ? (
          <EmptyState
            icon={FiBriefcase}
            title="No jobs found"
            message={admin ? "No jobs match this filter." : "Post your first role to start receiving applications."}
            action={
              !admin && (
                <Link to="/employer/jobs/new" className={buttonClass}>
                  Post a job
                </Link>
              )
            }
          />
        ) : (
          <>
            <ul className="space-y-4">
              {data.jobs.map((job) => (
                <li key={job._id} className={`${cardClass} p-5 sm:p-6`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold">
                        <Link to={`/jobs/${job._id}`} className="hover:underline">
                          {job.title}
                        </Link>
                      </h2>
                      <p className="text-sm text-[#60766b]">
                        {job.company}
                        {admin && job.createdBy?.name ? ` · by ${job.createdBy.name}` : ""} · Posted {formatDate(job.createdAt)}
                      </p>
                    </div>
                    <StatusBadge value={job.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-[#60766b]">
                      {typeof job.applicantsCount === "number"
                        ? `${job.applicantsCount} applicants · ${job.pendingCount} pending`
                        : job.location}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/employer/jobs/${job._id}/applicants`} className={secondaryButtonClass}>
                        <FiUsers aria-hidden="true" /> Applicants
                      </Link>
                      <Link to={`/employer/jobs/${job._id}/edit`} className={secondaryButtonClass}>
                        <FiEdit2 aria-hidden="true" /> Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setTarget(job)}
                        aria-label={`Delete ${job.title}`}
                        className={`${secondaryButtonClass} text-red-600 hover:border-red-300`}
                      >
                        <FiTrash2 aria-hidden="true" /> Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />
          </>
        ))}

      <ConfirmDialog
        open={Boolean(target)}
        title="Delete this job?"
        message={`"${target?.title || ""}" and all of its applications will be permanently removed.`}
        confirmLabel="Delete job"
        loading={working}
        onConfirm={handleDelete}
        onCancel={() => setTarget(null)}
      />
    </>
  );
};

export default ManageJobs;
