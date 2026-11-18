const Field = ({ id, label, error, hint, required, labelAction, children }) => (
  <div>
    <div className="mb-2 flex items-center justify-between gap-3">
      <label htmlFor={id} className="block text-sm font-medium text-[#163832]">
        {label}
        {required && (
          <span aria-hidden="true" className="text-red-500">
            {" "}
            *
          </span>
        )}
      </label>
      {labelAction}
    </div>
    {children}
    {hint && !error && (
      <p id={`${id}-hint`} className="mt-1.5 text-xs text-[#60766b]">
        {hint}
      </p>
    )}
    {error && (
      <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600">
        {error}
      </p>
    )}
  </div>
);

export default Field;
