import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FiLogOut, FiMenu, FiX } from "react-icons/fi";
import Logo from "./Logo.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { initials } from "../utils/format.js";

const LINKS = {
  candidate: [
    { to: "/", label: "Dashboard", end: true },
    { to: "/jobs", label: "Find jobs" },
    { to: "/my-applications", label: "My applications" },
  ],
  employer: [
    { to: "/", label: "Dashboard", end: true },
    { to: "/employer/jobs", label: "My jobs" },
    { to: "/employer/jobs/new", label: "Post a job" },
    { to: "/jobs", label: "Browse jobs" },
  ],
  admin: [
    { to: "/", label: "Dashboard", end: true },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/jobs", label: "Jobs" },
    { to: "/admin/applications", label: "Applications" },
  ],
};

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-[#DAF1DE] text-[#0B2B26]" : "text-[#60766b] hover:bg-[#f5f8f5] hover:text-[#051F20]"
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const links = LINKS[user.role] || [];

  return (
    <header className="sticky top-0 z-40 border-b border-[#e3ebe4] bg-white/90 backdrop-blur">
      <div className="app-container mx-auto flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label="FlowNexa home" className="flex shrink-0 items-center gap-2">
          <Logo tone="light" showText={false} className="h-8 w-auto" />
          <span className="text-base font-semibold text-[#0B2B26]">FlowNexa</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-[#f5f8f5]"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#235347] text-xs font-semibold text-[#DAF1DE]"
            >
              {initials(user.name)}
            </span>
            <span className="max-w-[140px] truncate text-sm font-medium text-[#163832]">
              {user.name}
            </span>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#d2e1d6] px-3 text-sm font-semibold text-[#163832] transition hover:border-[#235347]"
          >
            <FiLogOut aria-hidden="true" /> Sign out
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d2e1d6] text-[#163832] lg:hidden"
        >
          {open ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-[#e3ebe4] bg-white px-4 py-3 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/profile" onClick={() => setOpen(false)} className={linkClass}>
              Profile
            </NavLink>
            <button
              type="button"
              onClick={logout}
              className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <FiLogOut aria-hidden="true" /> Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
