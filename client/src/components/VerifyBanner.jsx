import { useState } from "react";
import { FiMail } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { resendVerification } from "../services/auth.service.js";
import { getErrorMessage } from "../utils/format.js";

const VerifyBanner = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [sending, setSending] = useState(false);

  if (user.isEmailVerified) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      const response = await resendVerification();
      toast.success(response.message, "Check your inbox");
    } catch (error) {
      toast.error(getErrorMessage(error), "Could not send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div role="region" aria-label="Email verification" className="border-b border-amber-200 bg-amber-50">
      <div className="app-container mx-auto flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5 text-sm text-amber-900">
        <FiMail aria-hidden="true" className="shrink-0" />
        <p className="flex-1">Please verify your email address to secure your account.</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={sending}
          className="font-semibold underline underline-offset-2 hover:no-underline disabled:opacity-60"
        >
          {sending ? "Sending…" : "Resend link"}
        </button>
      </div>
    </div>
  );
};

export default VerifyBanner;
