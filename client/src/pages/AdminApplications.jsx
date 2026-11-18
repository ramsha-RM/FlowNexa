import { useState } from "react";
import { Link } from "react-router-dom";
import { FiFileText, FiTrash2 } from "react-icons/fi";
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
import { getAdminApplications } from "../services/admin.service.js";
import { deleteApplication } from "../services/application.service.js";
import { cardClass, inputClass, linkClass } from "../style/classes.js";
import { formatDate, getErrorMessage } from "../utils/format.js";

const STATUSES = ["Pending", "Accepted", "Rejected"];

const AdminApplications = () => {
  useDocumentTitle("Applications");
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [target, setTarget] = useState(null);
  const [working, setWorking] = useState(false);

  const { data, loading, error, reload } = useFetch(
    () => getAdminApplications({ page, status, limit: 10 }),
    [page, status],
  );

  const handleDelete = async () => {
    setWorking(true);
    try {
      await deleteApplication(target._id);
      toast.success("Application deleted.", "Done");
      setTarget(null);
      if (data.applications.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      toast.error(getErrorMessage(err), "Could not delete");
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Applications"
        description="Every application submitted on the platform."
        actions={
          <div>
            <label htmlFor="app-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="app-status"
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
          <EmptyState icon={FiFileText} title="No applications found" message="Nothing matches this filter." />
        ) : (
          <>
            <div className={`${cardClass} overflow-x-auto`}>
              <table className="w-full min-w-[720px] text-left text-sm">
                <caption className="sr-only">All applications</caption>
                <thead className="border-b border-[#e3ebe4] bg-[#f5f8f5] text-xs uppercase tracking-wide text-[#60766b]">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Candidate</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Job</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Applied</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3ebe4]">
                  {data.applications.map((application) => (
                    <tr key={application._id}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#051F20]">{application.user?.name || "Deleted user"}</p>
                        <p className="text-[#60766b]">{application.user?.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        {application.job ? (
                          <Link to={`/jobs/${application.job._id}`} className={linkClass}>
                            {application.job.title}
                          </Link>
                        ) : (
                          "Job removed"
                        )}
                        <p className="text-xs text-[#52675d]">{application.job?.company}</p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge value={application.status} />
                      </td>
                      <td className="px-5 py-4 text-[#60766b]">{formatDate(application.createdAt)}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setTarget(application)}
                          aria-label={`Delete application from ${application.user?.name || "user"}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <FiTrash2 aria-hidden="true" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />
          </>
        ))}

      <ConfirmDialog
        open={Boolean(target)}
        title="Delete this application?"
        message="The application and its uploaded resume will be permanently removed."
        confirmLabel="Delete"
        loading={working}
        onConfirm={handleDelete}
        onCancel={() => setTarget(null)}
      />
    </>
  );
};

export default AdminApplications;
