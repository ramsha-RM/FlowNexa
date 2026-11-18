import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiBriefcase, FiSearch } from "react-icons/fi";
import PageHeader from "../components/PageHeader.jsx";
import JobCard from "../components/JobCard.jsx";
import Pagination from "../components/Pagination.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import { PageLoader } from "../components/Loader.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { getJobs } from "../services/job.service.js";
import { inputClass, secondaryButtonClass } from "../style/classes.js";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
const LEVELS = ["Entry", "Mid", "Senior", "Lead"];

const Jobs = () => {
  useDocumentTitle("Find jobs");
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const jobType = params.get("jobType") || "";
  const experienceLevel = params.get("experienceLevel") || "";
  const remote = params.get("remote") || "";
  const page = Math.max(Number(params.get("page")) || 1, 1);
  const [search, setSearch] = useState(q);
  const timer = useRef(null);

  const updateParams = (changes, keepPage = false) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      Object.entries(changes).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      if (!keepPage) next.delete("page");
      return next;
    });

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => updateParams({ q: value.trim() }), 400);
  };

  const clearFilters = () => {
    setSearch("");
    setParams(new URLSearchParams());
  };

  const { data, loading, error, reload } = useFetch(
    () => getJobs({ q, jobType, experienceLevel, remote, page, limit: 10 }),
    [q, jobType, experienceLevel, remote, page],
  );

  const hasFilters = Boolean(q || jobType || experienceLevel || remote);

  return (
    <>
      <PageHeader
        eyebrow="Opportunities"
        title="Find your next role"
        description="Search open positions and apply in a couple of minutes."
      />

      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="mb-6 grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
      >
        <div className="relative">
          <label htmlFor="job-search" className="sr-only">
            Search jobs
          </label>
          <FiSearch aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#52675d]" />
          <input
            id="job-search"
            type="search"
            value={search}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Search title, company, skill or location"
            maxLength={100}
            className={`${inputClass} pl-11`}
          />
        </div>
        <div>
          <label htmlFor="filter-type" className="sr-only">
            Job type
          </label>
          <select id="filter-type" value={jobType} onChange={(event) => updateParams({ jobType: event.target.value })} className={inputClass}>
            <option value="">All types</option>
            {JOB_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-level" className="sr-only">
            Experience level
          </label>
          <select id="filter-level" value={experienceLevel} onChange={(event) => updateParams({ experienceLevel: event.target.value })} className={inputClass}>
            <option value="">Any level</option>
            {LEVELS.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </div>
        <label className="flex h-12 cursor-pointer items-center gap-2.5 rounded-xl border border-[#d2e1d6] bg-[#fbfdfb] px-4 text-sm text-[#163832]">
          <input
            type="checkbox"
            checked={remote === "true"}
            onChange={(event) => updateParams({ remote: event.target.checked ? "true" : "" })}
            className="h-4 w-4 rounded accent-[#235347]"
          />
          Remote only
        </label>
      </form>

      {loading && <PageLoader label="Finding jobs…" />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <>
          <p className="mb-4 text-sm text-[#60766b]" aria-live="polite">
            {data.total} {data.total === 1 ? "job" : "jobs"} found
          </p>
          {data.jobs.length === 0 ? (
            <EmptyState
              icon={FiBriefcase}
              title="No jobs match your search"
              message="Try different keywords or remove some filters."
              action={
                hasFilters && (
                  <button type="button" onClick={clearFilters} className={secondaryButtonClass}>
                    Clear filters
                  </button>
                )
              }
            />
          ) : (
            <ul className="space-y-4">
              {data.jobs.map((job) => (
                <li key={job._id}>
                  <JobCard job={job} />
                </li>
              ))}
            </ul>
          )}
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            onChange={(next) => {
              updateParams({ page: String(next) }, true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}
    </>
  );
};

export default Jobs;
