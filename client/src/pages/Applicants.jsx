import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiCheck, FiRotateCcw, FiUsers, FiX } from "react-icons/fi";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Pagination from "../components/Pagination.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import { PageLoader } from "../components/Loader.jsx";
import { useToast } from "../hooks/useToast.js";
import { useFetch } from "../hooks/useFetch.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { getJobApplicants, updateApplicationStatus } from "../services/application.service.js";
import { cardClass, linkClass, secondaryButtonClass } from "../style/classes.js";
import { formatDate, getErrorMessage, initials, resumeUrl } from "../utils/format.js";

const TABS = ["", "Pending", "Accepted", "Rejected"];

const Applicants = () => {
  const { id } = useParams();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [updating, setUpdating] = useState("");

  const { data, loading, error, reload } = useFetch(
    () => getJobApplicants(id, { page, status, limit: 10 }),
    [id, page, status],
  );

  useDocumentTitle(data?.job ? `Applicants · ${data.job.title}` : "Applicants");

  const handleStatus = async (application, nextStatus) => {
    setUpdating(application._id);
    try {
      const response = await updateApplicationStatus(application._id, nextStatus);
      toast.success(response.message, "Updated");
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err), "Could not update");
    } finally {
      setUpdating("");
    }
  };

  const counts = data?.counts || {};
  const totalAll = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return (
    <>
      <Link to="/employer/jobs" className="text-sm font-medium text-[#235347] hover:underline">
        ← Back to jobs
      </Link>
      <div className="mt-3" />
      <PageHeader
        eyebrow="Applicants"
        title={data?.job ? data.job.title : "Applicants"}
        description={data?.job ? `${data.job.company} · ${totalAll} total applications` : undefined}
        actions={
          data?.job && (
            <Link to={`/jobs/${data.job._id}`} className={secondaryButtonClass}>
              View job
            </Link>
          )
        }
      />

      <div role="tablist" aria-label="Filter applicants" className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const count = tab ? counts[tab] || 0 : totalAll;
          const active = status === tab;
          return (
            <button
              key={tab || "all"}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setStatus(tab);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-[#0B2B26] text-white"
                  : "border border-[#d2e1d6] bg-white text-[#163832] hover:border-[#235347]"
              }`}
            >
              {tab || "All"} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {loading && <PageLoader />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data &&
        (data.applicants.length === 0 ? (
          <EmptyState
            icon={FiUsers}
            title="No applicants here"
            message={status ? "No applications with this status yet." : "Applications will appear here as candidates apply."}
          />
        ) : (
          <>
            <ul className="space-y-4">
              {data.applicants.map((application) => {
                const busy = updating === application._id;
                return (
                  <li key={application._id} className={`${cardClass} p-5 sm:p-6`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#235347] text-sm font-semibold text-[#DAF1DE]"
                        >
                          {initials(application.user?.name)}
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-semibold">
                            {application.user?.name || "Deleted user"}
                          </h2>
                          {application.user?.email && (
                            <a href={`mailto:${application.user.email}`} className={`truncate text-sm ${linkClass}`}>
                              {application.user.email}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#52675d]">Applied {formatDate(application.createdAt)}</span>
                        <StatusBadge value={application.status} />
                      </div>
                    </div>

                    {application.coverLetter && (
                      <details className="mt-4 rounded-xl bg-[#f5f8f5] px-4 py-3 text-sm">
                        <summary className="cursor-pointer font-medium text-[#163832]">Cover letter</summary>
                        <p className="mt-3 whitespace-pre-line leading-6 text-[#163832]">{application.coverLetter}</p>
                      </details>
                    )}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      {application.hasResume ? (
                        <a
                          href={resumeUrl(application._id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-sm ${linkClass}`}
                        >
                          Open resume ({application.resumeOriginalName})
                        </a>
                      ) : (
                        <span className="text-sm text-[#52675d]">No resume</span>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {application.status !== "Accepted" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleStatus(application, "Accepted")}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <FiCheck aria-hidden="true" /> Accept
                          </button>
                        )}
                        {application.status !== "Rejected" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleStatus(application, "Rejected")}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                          >
                            <FiX aria-hidden="true" /> Reject
                          </button>
                        )}
                        {application.status !== "Pending" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleStatus(application, "Pending")}
                            className={secondaryButtonClass}
                          >
                            <FiRotateCcw aria-hidden="true" /> Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />
          </>
        ))}
    </>
  );
};

export default Applicants;
