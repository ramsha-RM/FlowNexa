export const Spinner = ({ className = "h-5 w-5" }) => (
  <svg
    className={`${className} animate-spin text-[#235347]`}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const FullPageLoader = () => (
  <div
    role="status"
    aria-live="polite"
    className="flex min-h-screen items-center justify-center bg-[#f5f8f5]"
  >
    <div className="flex flex-col items-center gap-3 text-sm text-[#60766b]">
      <Spinner className="h-8 w-8" />
      Loading FlowNexa…
    </div>
  </div>
);

export const PageLoader = ({ label = "Loading…" }) => (
  <div role="status" aria-live="polite" className="flex items-center justify-center py-20">
    <div className="flex flex-col items-center gap-3 text-sm text-[#60766b]">
      <Spinner className="h-7 w-7" />
      {label}
    </div>
  </div>
);

