import { useEffect, useRef, useState } from "react";
import { FiSearch, FiTrash2, FiUsers } from "react-icons/fi";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Pagination from "../components/Pagination.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { PageLoader } from "../components/Loader.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { useFetch } from "../hooks/useFetch.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { deleteUser, getUsers, updateUserRole } from "../services/admin.service.js";
import { cardClass, inputClass } from "../style/classes.js";
import { formatDate, getErrorMessage } from "../utils/format.js";

const ROLES = ["candidate", "employer", "admin"];

const AdminUsers = () => {
  useDocumentTitle("Users");
  const { user: me } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState(null);
  const [working, setWorking] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setQ(value.trim());
      setPage(1);
    }, 400);
  };

  const { data, loading, error, reload } = useFetch(
    () => getUsers({ page, role, q, limit: 10 }),
    [page, role, q],
  );

  const handleConfirm = async () => {
    setWorking(true);
    try {
      if (action.type === "delete") {
        await deleteUser(action.user.id);
        toast.success("User and related data deleted.", "Done");
        if (data.users.length === 1 && page > 1) setPage(page - 1);
        else reload();
      } else {
        await updateUserRole(action.user.id, action.role);
        toast.success(`Role changed to ${action.role}.`, "Done");
        reload();
      }
      setAction(null);
    } catch (err) {
      toast.error(getErrorMessage(err), "Action failed");
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Administration" title="Users" description="Manage accounts and roles across FlowNexa." />

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <label htmlFor="user-search" className="sr-only">
            Search users
          </label>
          <FiSearch aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#52675d]" />
          <input
            id="user-search"
            type="search"
            value={search}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Search name, email or company"
            maxLength={100}
            className={`${inputClass} pl-11`}
          />
        </div>
        <div>
          <label htmlFor="user-role" className="sr-only">
            Filter by role
          </label>
          <select
            id="user-role"
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All roles</option>
            {ROLES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <PageLoader />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data &&
        (data.users.length === 0 ? (
          <EmptyState icon={FiUsers} title="No users found" message="Try a different search or filter." />
        ) : (
          <>
            <div className={`${cardClass} overflow-x-auto`}>
              <table className="w-full min-w-[720px] text-left text-sm">
                <caption className="sr-only">Registered users</caption>
                <thead className="border-b border-[#e3ebe4] bg-[#f5f8f5] text-xs uppercase tracking-wide text-[#60766b]">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">User</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Role</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Joined</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3ebe4]">
                  {data.users.map((member) => {
                    const isMe = member.id === me.id;
                    return (
                      <tr key={member.id}>
                        <td className="px-5 py-4">
                          <p className="font-medium text-[#051F20]">
                            {member.name}
                            {isMe && <span className="ml-2 text-xs text-[#52675d]">(you)</span>}
                          </p>
                          <p className="text-[#60766b]">{member.email}</p>
                          {member.company && <p className="text-xs text-[#52675d]">{member.company}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <label htmlFor={`role-${member.id}`} className="sr-only">
                            Role for {member.name}
                          </label>
                          <select
                            id={`role-${member.id}`}
                            value={member.role}
                            disabled={isMe}
                            onChange={(event) => setAction({ type: "role", user: member, role: event.target.value })}
                            className="h-9 rounded-lg border border-[#d2e1d6] bg-white px-2 text-sm disabled:opacity-60"
                          >
                            {ROLES.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                          <span className="ml-2 align-middle">
                            <StatusBadge value={member.role} />
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#60766b]">{formatDate(member.createdAt)}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            disabled={isMe}
                            onClick={() => setAction({ type: "delete", user: member })}
                            aria-label={`Delete ${member.name}`}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <FiTrash2 aria-hidden="true" /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />
          </>
        ))}

      <ConfirmDialog
        open={Boolean(action)}
        title={action?.type === "delete" ? "Delete this user?" : "Change role?"}
        message={
          action?.type === "delete"
            ? `${action?.user.name} and all of their jobs and applications will be permanently deleted.`
            : `${action?.user.name} will become ${action?.role}. This changes what they can access immediately.`
        }
        confirmLabel={action?.type === "delete" ? "Delete user" : "Change role"}
        tone={action?.type === "delete" ? "danger" : "primary"}
        loading={working}
        onConfirm={handleConfirm}
        onCancel={() => setAction(null)}
      />
    </>
  );
};

export default AdminUsers;

