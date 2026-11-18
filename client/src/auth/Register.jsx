import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout.jsx";
import Field from "../components/Field.jsx";
import PasswordField from "../components/PasswordField.jsx";
import GoogleButton from "../components/GoogleButton.jsx";
import { register } from "../services/auth.service.js";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import {
  alertErrorClass,
  eyebrowClass,
  headingClass,
  inputClass,
  inputErrorClass,
  linkClass,
  mutedClass,
  primaryButtonClass,
} from "../style/classes.js";
import { getErrorMessage, getFieldErrors, passwordChecks } from "../utils/format.js";
import { fieldProps } from "../utils/form.js";

const ROLES = [
  { value: "candidate", title: "Job seeker", text: "Find and apply for jobs" },
  { value: "employer", title: "Employer", text: "Post jobs and hire" },
];

const Register = () => {
  useDocumentTitle("Create account");
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState("candidate");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const errors = {};
    if (name.trim().length < 2) errors.name = "Please enter your full name.";
    if (role === "employer" && !company.trim()) errors.company = "Company name is required.";
    if (!passwordChecks(password).every((check) => check.passed)) {
      errors.password = "Password must be 8+ characters with a letter and a number.";
    }
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        company: role === "employer" ? company.trim() : undefined,
      });
      login(response.user);
      toast.success(response.message, "Welcome to FlowNexa");
      navigate("/", { replace: true });
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, "We couldn't create your account. Please try again."));
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6">
        <p className={eyebrowClass}>Get started</p>
        <h2 className={headingClass}>Create your account</h2>
        <p className={`mt-2 ${mutedClass}`}>Build a clearer path to your next opportunity.</p>
      </div>

      {error && (
        <p role="alert" className={`mb-5 ${alertErrorClass}`}>
          {error}
        </p>
      )}

      <form onSubmit={handleRegister} className="space-y-5" noValidate>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-[#163832]">I am a</legend>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((item) => (
              <label
                key={item.value}
                className={`cursor-pointer rounded-xl border p-3 transition focus-within:ring-4 focus-within:ring-[#8EB69B]/30 ${
                  role === item.value
                    ? "border-[#235347] bg-[#DAF1DE]/50"
                    : "border-[#d2e1d6] bg-[#fbfdfb] hover:border-[#8EB69B]"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={item.value}
                  checked={role === item.value}
                  onChange={() => setRole(item.value)}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold text-[#051F20]">{item.title}</span>
                <span className="mt-0.5 block text-xs text-[#60766b]">{item.text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field id="register-name" label="Full name" error={fieldErrors.name}>
          <input
            {...fieldProps("register-name", { error: fieldErrors.name })}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your full name"
            autoComplete="name"
            maxLength={60}
            required
            className={`${inputClass} ${fieldErrors.name ? inputErrorClass : ""}`}
          />
        </Field>

        {role === "employer" && (
          <Field id="register-company" label="Company name" error={fieldErrors.company}>
            <input
              {...fieldProps("register-company", { error: fieldErrors.company })}
              type="text"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Your company"
              autoComplete="organization"
              maxLength={100}
              required
              className={`${inputClass} ${fieldErrors.company ? inputErrorClass : ""}`}
            />
          </Field>
        )}

        <Field id="register-email" label="Email address" error={fieldErrors.email}>
          <input
            {...fieldProps("register-email", { error: fieldErrors.email })}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className={`${inputClass} ${fieldErrors.email ? inputErrorClass : ""}`}
          />
        </Field>

        <PasswordField
          id="register-password"
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a password"
          autoComplete="new-password"
          error={fieldErrors.password}
          showStrength
        />

        <PasswordField
          id="register-confirm"
          label="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
        />

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Creating account..." : "Create account"}
          {!loading && <span aria-hidden="true">→</span>}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-[#52675d]">
        <span className="h-px flex-1 bg-[#e3ebe4]" />
        or
        <span className="h-px flex-1 bg-[#e3ebe4]" />
      </div>

      <GoogleButton role={role} label="Sign up with Google" />

      <p className={`mt-7 text-center ${mutedClass}`}>
        Already have an account?{" "}
        <Link to="/login" className={linkClass}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;

