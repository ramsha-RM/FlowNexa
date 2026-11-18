import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiInbox,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import { PageLoader } from "../components/Loader.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useFetch } from "../hooks/useFetch.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { getMyApplications } from "../services/application.service.js";
import { getMyJobs } from "../services/job.service.js";
import { getStats } from "../services/admin.service.js";
import { buttonClass, cardClass, linkClass } from "../style/classes.js";
import { formatDate, timeAgo } from "../utils/format.js";

const fetchCandidate = async () => {
  const [recent, pending, accepted, rejected] = await Promise.all([
    getMyApplications({ limit: 5 }),
    getMyApplications({ limit: 1, status: "Pending" }),
    getMyApplications({ limit: 1, status: "Accepted" }),
    getMyApplications({ limit: 1, status: "Rejected" }),
  ]);
  return {
    recent: recent.applications,
    total: recent.total,
    pending: pending.total,
    accepted: accepted.total,
    rejected: rejected.total,
  };
};

const CandidateDashboard = () => {
  const { data, loading, error, reload } = useFetch(fetchCandidate, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications" value={data.total} icon={FiFileText} />
        <StatCard label="Pending" value={data.pending} icon={FiClock} tone="bg-amber-50 text-amber-700" />
        <StatCard label="Accepted" value={data.accepted} icon={FiCheckCircle} tone="bg-emerald-50 text-emerald-700" />
        <StatCard label="Rejected" value={data.rejected} icon={FiXCircle} tone="bg-red-50 text-red-600" />
      </div>

      <section aria-labelledby="recent-heading" className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recent-heading" className="text-lg font-semibold">
            Recent applications
          </h2>
          <Link to="/my-applications" className={`text-sm ${linkClass}`}>
            View all
          </Link>
        </div>

        {data.recent.length === 0 ? (
          <EmptyState
            icon={FiInbox}
            title="No applications yet"
            message="Browse open roles and send your first application."
            action={
              <Link to="/jobs" className={buttonClass}>
                Find jobs
              </Link>
            }
          />
        ) : (
          <ul className={`${cardClass} divide-y divide-[#e3ebe4]`}>
            {data.recent.map((application) => (
              <li key={application._id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#051F20]">
                    {application.job ? (
                      <Link to={`/jobs/${application.job._id}`} className="hover:underline">
                        {application.job.title}
                      </Link>
                    ) : (
                      "Job removed"
                    )}
                  </p>
                  <p className="text-sm text-[#60766b]">
                    {application.job?.company} · Applied {timeAgo(application.createdAt)}
                  </p>
                </div>
                <StatusBadge value={application.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
};

const EmployerDashboard = () => {
  const { data, loading, error, reload } = useFetch(() => getMyJobs({ limit: 5, stats: "true" }), []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const jobStats = data.stats?.jobs || {};
  const applicationStats = data.stats?.applications || {};
  const totalApplicants = Object.values(applicationStats).reduce((sum, count) => sum + count, 0);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total jobs" value={data.total} icon={FiBriefcase} />
        <StatCard label="Open jobs" value={jobStats.open || 0} icon={FiCheckCircle} tone="bg-emerald-50 text-emerald-700" />
        <StatCard label="Applicants" value={totalApplicants} icon={FiUsers} tone="bg-blue-50 text-blue-700" />
        <StatCard label="Awaiting review" value={applicationStats.Pending || 0} icon={FiClock} tone="bg-amber-50 text-amber-700" />
      </div>

      <section aria-labelledby="jobs-heading" className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="jobs-heading" className="text-lg font-semibold">
            Latest jobs
          </h2>
          <Link to="/employer/jobs" className={`text-sm ${linkClass}`}>
            Manage all
          </Link>
        </div>

        {data.jobs.length === 0 ? (
          <EmptyState
            icon={FiBriefcase}
            title="You have not posted a job yet"
            message="Post your first role and start receiving applications."
            action={
              <Link to="/employer/jobs/new" className={buttonClass}>
                Post a job
              </Link>
            }
          />
        ) : (
          <ul className={`${cardClass} divide-y divide-[#e3ebe4]`}>
            {data.jobs.map((job) => (
              <li key={job._id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#051F20]">
                    <Link to={`/jobs/${job._id}`} className="hover:underline">
                      {job.title}
                    </Link>
                  </p>
                  <p className="text-sm text-[#60766b]">
                    {job.applicantsCount} applicants · {job.pendingCount} pending · Posted {formatDate(job.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge value={job.status} />
                  <Link to={`/employer/jobs/${job._id}/applicants`} className={`text-sm ${linkClass}`}>
                    Applicants
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
};

const AdminDashboard = () => {
  const { data, loading, error, reload } = useFetch(getStats, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const sum = (map) => Object.values(map).reduce((total, count) => total + count, 0);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={sum(data.users)} icon={FiUsers} />
        <StatCard label="Employers" value={data.users.employer || 0} icon={FiBriefcase} tone="bg-blue-50 text-blue-700" />
        <StatCard label="Open jobs" value={data.jobs.open || 0} icon={FiCheckCircle} tone="bg-emerald-50 text-emerald-700" />
        <StatCard label="Applications" value={sum(data.applications)} icon={FiFileText} tone="bg-amber-50 text-amber-700" />
      </div>

      <section aria-labelledby="users-heading" className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="users-heading" className="text-lg font-semibold">
            Newest users
          </h2>
          <Link to="/admin/users" className={`text-sm ${linkClass}`}>
            Manage users
          </Link>
        </div>
        <ul className={`${cardClass} divide-y divide-[#e3ebe4]`}>
          {data.recentUsers.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
              <div className="min-w-0">
                <p className="truncate font-medium text-[#051F20]">{member.name}</p>
                <p className="truncate text-sm text-[#60766b]">{member.email}</p>
              </div>
              <StatusBadge value={member.role} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  useDocumentTitle("Dashboard");

  const copy = {
    candidate: "Track your applications and discover new roles.",
    employer: "See how your jobs and applicants are performing.",
    admin: "Platform overview and moderation tools.",
  };

  return (
    <>
      <PageHeader
        eyebrow={user.role}
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={copy[user.role]}
        actions={
          user.role === "candidate" ? (
            <Link to="/jobs" className={buttonClass}>
              Find jobs
            </Link>
          ) : user.role === "employer" ? (
            <Link to="/employer/jobs/new" className={buttonClass}>
              Post a job
            </Link>
          ) : null
        }
      />
      {user.role === "candidate" && <CandidateDashboard />}
      {user.role === "employer" && <EmployerDashboard />}
      {user.role === "admin" && <AdminDashboard />}
    </>
  );
};

export default Dashboard;
