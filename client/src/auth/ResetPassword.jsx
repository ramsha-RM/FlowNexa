import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "./AuthLayout.jsx";
import PasswordField from "../components/PasswordField.jsx";
import { resetPassword } from "../services/auth.service.js";
import { useToast } from "../hooks/useToast.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import {
  alertErrorClass,
  eyebrowClass,
  headingClass,
  linkClass,
  mutedClass,
  primaryButtonClass,
} from "../style/classes.js";
import { getErrorMessage, passwordChecks } from "../utils/format.js";

const ResetPassword = () => {
  useDocumentTitle("Choose a new password");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!passwordChecks(password).every((check) => check.passed)) {
      setError("Password must be 8+ characters with a letter and a number.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(token, password);
      toast.success(response.message, "Password updated");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout>
        <p className={eyebrowClass}>Account recovery</p>
        <h2 className={headingClass}>This link is incomplete</h2>
        <p className={`mt-2 ${mutedClass}`}>
          The reset link is missing its token. Request a new link and try again.
        </p>
        <Link to="/forgot-password" className={`${primaryButtonClass} mt-7`}>
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <p className={eyebrowClass}>Account recovery</p>
        <h2 className={headingClass}>Choose a new password</h2>
        <p className={`mt-2 ${mutedClass}`}>Use something you do not use anywhere else.</p>
      </div>

      {error && (
        <p role="alert" className={`mb-5 ${alertErrorClass}`}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <PasswordField
          id="reset-password"
          label="New password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          placeholder="Create a new password"
          showStrength
        />
        <PasswordField
          id="reset-confirm"
          label="Confirm new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          placeholder="Repeat your new password"
        />
        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>

      <p className={`mt-7 text-center ${mutedClass}`}>
        <Link to="/login" className={linkClass}>
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ResetPassword;
