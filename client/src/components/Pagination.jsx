import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { secondaryButtonClass } from "../style/classes.js";

const Pagination = ({ page, pages, total, onChange }) => {
  if (!pages || pages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[#60766b]"
    >
      <p>
        Page {page} of {pages}
        {typeof total === "number" ? ` · ${total} results` : ""}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className={secondaryButtonClass}
        >
          <FiChevronLeft aria-hidden="true" /> Previous
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className={secondaryButtonClass}
        >
          Next <FiChevronRight aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
