import { useState } from "react";
import { FiCheck } from "react-icons/fi";
import Field from "./Field.jsx";
import { inputClass, inputErrorClass } from "../style/classes.js";
import { fieldProps } from "../utils/form.js";
import { passwordChecks } from "../utils/format.js";

const PasswordField = ({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  error,
  showStrength = false,
  required = true,
  labelAction,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <Field id={id} label={label} error={error} labelAction={labelAction}>
      <div className="relative">
        <input
          {...fieldProps(id, { error })}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          maxLength={72}
          className={`${inputClass} pr-20 ${error ? inputErrorClass : ""}`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-4 text-xs font-semibold text-[#60766b] hover:text-[#235347]"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {showStrength && (
        <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1" aria-label="Password requirements">
          {passwordChecks(value).map((check) => (
            <li
              key={check.label}
              className={`flex items-center gap-1.5 text-xs ${
                check.passed ? "text-emerald-700" : "text-[#52675d]"
              }`}
            >
              <FiCheck aria-hidden="true" className={check.passed ? "opacity-100" : "opacity-30"} />
              {check.label}
              <span className="sr-only">{check.passed ? " met" : " not met"}</span>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
};

export default PasswordField;
