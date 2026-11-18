import { eyebrowClass, headingClass, mutedClass } from "../style/classes.js";

const PageHeader = ({ eyebrow, title, description, actions }) => (
  <div className="mb-8 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow && <p className={eyebrowClass}>{eyebrow}</p>}
      <h1 className={`${headingClass} break-words`}>{title}</h1>
      {description && <p className={`${mutedClass} mt-2 max-w-2xl`}>{description}</p>}
    </div>
    {actions && <div className="flex w-full flex-wrap gap-3 sm:w-auto sm:justify-end">{actions}</div>}
  </div>
);

export default PageHeader;
