import { FiAlertCircle } from "react-icons/fi";
import { cardClass, secondaryButtonClass } from "../style/classes.js";

const ErrorState = ({ message, onRetry }) => (
  <div role="alert" className={`${cardClass} flex flex-col items-center px-6 py-12 text-center`}>
    <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
      <FiAlertCircle className="h-6 w-6" aria-hidden="true" />
    </span>
    <h3 className="text-base font-semibold text-[#051F20]">Something went wrong</h3>
    <p className="mt-1.5 max-w-sm text-sm leading-6 text-[#60766b]">{message}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className={`${secondaryButtonClass} mt-5`}>
        Try again
      </button>
    )}
  </div>
);

export default ErrorState;
