import { cardClass } from "../style/classes.js";

const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className={`${cardClass} flex flex-col items-center px-6 py-14 text-center`}>
    {Icon && (
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#DAF1DE] text-[#235347]">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
    )}
    <h3 className="text-base font-semibold text-[#051F20]">{title}</h3>
    {message && <p className="mt-1.5 max-w-sm text-sm leading-6 text-[#60766b]">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
