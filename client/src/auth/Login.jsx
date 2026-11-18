import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "./AuthLayout.jsx";
import Field from "../components/Field.jsx";
import PasswordField from "../components/PasswordField.jsx";
import GoogleButton from "../components/GoogleButton.jsx";
import { login } from "../services/auth.service.js";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import {
  alertErrorClass,
  eyebrowClass,
  headingClass,
  inputClass,
  linkClass,
  mutedClass,
  primaryButtonClass,
} from "../style/classes.js";
import { getErrorMessage } from "../utils/format.js";
import { fieldProps } from "../utils/form.js";

const Login = () => {
  useDocumentTitle("Sign in");
  const { login: authLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(searchParams.get("error") || "");
  const [loading, setLoading] = useState(false);

  const destination = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (location.state?.expired) {
      toast.warning("Your session expired. Please sign in again.", "Signed out");
    }
  }, [location.state, toast]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await login(email.trim(), password);
      authLogin(response.user);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Login failed. Please check your credentials."));
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-7">
        <p className={eyebrowClass}>Welcome back</p>
        <h2 className={headingClass}>Sign in to FlowNexa</h2>
        <p className={`mt-2 ${mutedClass}`}>Pick up right where you left off.</p>
      </div>

      {error && (
        <p role="alert" className={`mb-5 ${alertErrorClass}`}>
          {error}
        </p>
      )}

      <form onSubmit={handleLogin} className="space-y-5" noValidate>
        <Field id="login-email" label="Email address">
          <input
            {...fieldProps("login-email")}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className={inputClass}
          />
        </Field>

        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          labelAction={
            <Link to="/forgot-password" className="text-xs font-semibold text-[#235347] hover:text-[#051F20] hover:underline">
              Forgot password?
            </Link>
          }
        />

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Signing in..." : "Sign in"}
          {!loading && <span aria-hidden="true">→</span>}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-[#52675d]">
        <span className="h-px flex-1 bg-[#e3ebe4]" />
        or
        <span className="h-px flex-1 bg-[#e3ebe4]" />
      </div>

      <GoogleButton />

      <p className={`mt-7 text-center ${mutedClass}`}>
        New to FlowNexa?{" "}
        <Link to="/register" className={linkClass}>
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;

