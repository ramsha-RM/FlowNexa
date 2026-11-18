import { useState } from "react";
import { Link } from "react-router-dom";
import { FiFileText } from "react-icons/fi";
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
import { deleteApplication, getMyApplications } from "../services/application.service.js";
import { buttonClass, cardClass, inputClass, linkClass, secondaryButtonClass } from "../style/classes.js";
import { formatDate, getErrorMessage, resumeUrl } from "../utils/format.js";

const STATUSES = ["Pending", "Accepted", "Rejected"];

const MyApplications = () => {
  useDocumentTitle("My applications");
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [target, setTarget] = useState(null);
  const [working, setWorking] = useState(false);

  const { data, loading, error, reload } = useFetch(
    () => getMyApplications({ page, status, limit: 10 }),
    [page, status],
  );

  const handleWithdraw = async () => {
    setWorking(true);
    try {
      await deleteApplication(target._id);
      toast.success("Application withdrawn.", "Done");
      setTarget(null);
      if (data.applications.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      toast.error(getErrorMessage(err), "Could not withdraw");
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Candidate"
        title="My applications"
        description="Follow every application and see how employers respond."
        actions={
          <div>
            <label htmlFor="status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="status-filter"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className={`${inputClass} h-10`}
            >
              <option value="">All statuses</option>
              {STATUSES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        }
      />

      {loading && <PageLoader />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data &&
        (data.applications.length === 0 ? (
          <EmptyState
            icon={FiFileText}
            title="Nothing here yet"
            message="When you apply for a job it will show up here."
            action={
              <Link to="/jobs" className={buttonClass}>
                Find jobs
              </Link>
            }
          />
        ) : (
          <>
            <ul className="space-y-4">
              {data.applications.map((application) => (
                <li key={application._id} className={`${cardClass} p-5 sm:p-6`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold">
                        {application.job ? (
                          <Link to={`/jobs/${application.job._id}`} className="hover:underline">
                            {application.job.title}
                          </Link>
                        ) : (
                          "This job was removed"
                        )}
                      </h2>
                      <p className="text-sm text-[#60766b]">
                        {application.job?.company}
                        {application.job?.location ? ` · ${application.job.location}` : ""}
                      </p>
                    </div>
                    <StatusBadge value={application.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#60766b]">
                    <span>Applied {formatDate(application.createdAt)}</span>
                    <div className="flex items-center gap-4">
                      {application.hasResume && (
                        <a
                          href={resumeUrl(application._id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={linkClass}
                        >
                          View resume
                        </a>
                      )}
                      <button type="button" onClick={() => setTarget(application)} className={secondaryButtonClass}>
                        Withdraw
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
        title="Withdraw application?"
        message="Your application and uploaded resume will be permanently removed."
        confirmLabel="Withdraw"
        loading={working}
        onConfirm={handleWithdraw}
        onCancel={() => setTarget(null)}
      />
    </>
  );
};

export default MyApplications;
