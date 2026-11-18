import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout.jsx";
import Field from "../components/Field.jsx";
import { forgotPassword } from "../services/auth.service.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import {
  alertErrorClass,
  alertSuccessClass,
  eyebrowClass,
  headingClass,
  inputClass,
  linkClass,
  mutedClass,
  primaryButtonClass,
} from "../style/classes.js";
import { getErrorMessage } from "../utils/format.js";
import { fieldProps } from "../utils/form.js";

const ForgotPassword = () => {
  useDocumentTitle("Reset password");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await forgotPassword(email.trim());
      setMessage(response.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-7">
        <p className={eyebrowClass}>Account recovery</p>
        <h2 className={headingClass}>Forgot your password?</h2>
        <p className={`mt-2 ${mutedClass}`}>
          Enter your email and we will send you a link to choose a new one.
        </p>
      </div>

      {message && (
        <p role="status" className={`mb-5 ${alertSuccessClass}`}>
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className={`mb-5 ${alertErrorClass}`}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field id="forgot-email" label="Email address">
          <input
            {...fieldProps("forgot-email")}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className={inputClass}
          />
        </Field>

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className={`mt-7 text-center ${mutedClass}`}>
        Remembered it?{" "}
        <Link to="/login" className={linkClass}>
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
