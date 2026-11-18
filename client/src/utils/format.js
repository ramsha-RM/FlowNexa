import { API_BASE_URL } from "../config.js";

export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  const data = error?.response?.data;
  if (data?.errors?.[0]?.message) return data.errors[0].message;
  if (data?.message) return data.message;
  if (error?.code === "ERR_NETWORK") {
    return "Cannot reach the server. Check your connection and try again.";
  }
  return fallback;
};

export const getFieldErrors = (error) => {
  const list = error?.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  return list.reduce((accumulator, item) => {
    if (item.field && !accumulator[item.field]) accumulator[item.field] = item.message;
    return accumulator;
  }, {});
};

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

export const timeAgo = (value) => {
  if (!value) return "";
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const steps = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return "just now";
};

export const formatSalary = (range) => {
  if (!range || (range.min == null && range.max == null)) return "";
  const currency = range.currency || "USD";
  const format = (amount) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  if (range.min != null && range.max != null) return `${format(range.min)} – ${format(range.max)}`;
  if (range.min != null) return `From ${format(range.min)}`;
  return `Up to ${format(range.max)}`;
};

export const isExpired = (job) => Boolean(job?.deadline) && new Date(job.deadline) < new Date();

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

export const resumeUrl = (applicationId) => `${API_BASE_URL}/applications/${applicationId}/resume`;

export const splitLines = (text) =>
  String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export const splitCommas = (text) =>
  String(text || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export const passwordChecks = (password) => [
  { label: "8+ characters", passed: password.length >= 8 },
  { label: "A letter", passed: /[A-Za-z]/.test(password) },
  { label: "A number", passed: /\d/.test(password) },
];
