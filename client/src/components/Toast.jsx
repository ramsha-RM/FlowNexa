import { useEffect } from "react";

const Toast = ({
  isOpen,
  message,
  onClose,
  type = "error",
  duration = 5000,
  title,
}) => {
  useEffect(() => {
    if (isOpen && duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const typeStyles = {
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-600",
      iconBg: "bg-red-100",
      text: "text-red-800",
      muted: "text-red-600",
    },
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: "text-emerald-600",
      iconBg: "bg-emerald-100",
      text: "text-emerald-800",
      muted: "text-emerald-600",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "text-amber-600",
      iconBg: "bg-amber-100",
      text: "text-amber-800",
      muted: "text-amber-600",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
      iconBg: "bg-blue-100",
      text: "text-blue-800",
      muted: "text-blue-600",
    },
  };

  const style = typeStyles[type] || typeStyles.error;

  const icons = {
    error: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    success: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    warning: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4v2m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    info: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className="fixed inset-x-4 bottom-4 z-50 animate-in slide-in-from-right-5 fade-in sm:inset-x-auto sm:bottom-6 sm:right-6"
    >
      <div
        className={`${style.bg} ${style.border} mx-auto flex w-full max-w-sm gap-3 rounded-lg border px-4 py-4 shadow-lg sm:mx-0 sm:px-5`}
      >
        <div className={`${style.iconBg} flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${style.icon}`}>
          {icons[type]}
        </div>
        <div className="flex flex-1 flex-col">
          {title && (
            <p className={`text-sm font-semibold ${style.text}`}>{title}</p>
          )}
          <p className={`text-sm ${style.muted}`}>
            {typeof message === "object" ? JSON.stringify(message) : message}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`flex-shrink-0 m-1 text-gray-400 transition hover:${style.icon}`}
          aria-label="Close"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;
