const STYLES = {
  Pending: "bg-amber-50 text-amber-800 ring-amber-200",
  Accepted: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Rejected: "bg-red-50 text-red-700 ring-red-200",
  open: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  closed: "bg-slate-100 text-slate-700 ring-slate-200",
  draft: "bg-amber-50 text-amber-800 ring-amber-200",
  admin: "bg-purple-50 text-purple-800 ring-purple-200",
  employer: "bg-blue-50 text-blue-800 ring-blue-200",
  candidate: "bg-[#DAF1DE] text-[#0B2B26] ring-[#8EB69B]/50",
  neutral: "bg-[#f5f8f5] text-[#163832] ring-[#d2e1d6]",
};

const StatusBadge = ({ value, label }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
      STYLES[value] || STYLES.neutral
    }`}
  >
    {label || value}
  </span>
);

export default StatusBadge;
