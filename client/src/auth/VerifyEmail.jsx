import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "./AuthLayout.jsx";
import { Spinner } from "../components/Loader.jsx";
import { verifyEmail } from "../services/auth.service.js";
import { useAuth } from "../hooks/useAuth.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import {
  alertErrorClass,
  alertSuccessClass,
  eyebrowClass,
  headingClass,
  primaryButtonClass,
} from "../style/classes.js";
import { getErrorMessage } from "../utils/format.js";

const VerifyEmail = () => {
  useDocumentTitle("Verify email");
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuth();
  const token = searchParams.get("token") || "";
  const [state, setState] = useState(token ? { status: "loading", message: "" } : { status: "error", message: "This verification link is incomplete." });

  useEffect(() => {
    if (!token) return undefined;
    let active = true;

    verifyEmail(token)
      .then((response) => {
        if (!active) return;
        setState({ status: "success", message: response.message });
        updateUser((current) => (current ? { ...current, isEmailVerified: true } : current));
      })
      .catch((error) => {
        if (active) setState({ status: "error", message: getErrorMessage(error) });
      });

    return () => {
      active = false;
    };
  }, [token, updateUser]);

  return (
    <AuthLayout>
      <p className={eyebrowClass}>Email verification</p>
      <h2 className={headingClass}>
        {state.status === "loading" && "Verifying your email…"}
        {state.status === "success" && "You are verified"}
        {state.status === "error" && "Verification failed"}
      </h2>

      <div className="mt-6" aria-live="polite">
        {state.status === "loading" && <Spinner className="h-7 w-7" />}
        {state.status === "success" && (
          <p role="status" className={alertSuccessClass}>
            {state.message}
          </p>
        )}
        {state.status === "error" && (
          <p role="alert" className={alertErrorClass}>
            {state.message}
          </p>
        )}
      </div>

      {state.status !== "loading" && (
        <Link to={user ? "/" : "/login"} className={`${primaryButtonClass} mt-7`}>
          {user ? "Go to dashboard" : "Go to sign in"}
        </Link>
      )}
    </AuthLayout>
  );
};

export default VerifyEmail;
