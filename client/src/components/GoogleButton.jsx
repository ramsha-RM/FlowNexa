import { FcGoogle } from "react-icons/fc";
import { googleLoginUrl } from "../services/auth.service.js";

const GoogleButton = ({ role = "candidate", label = "Continue with Google" }) => (
  <a
    href={googleLoginUrl(role)}
    className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#d2e1d6] bg-white text-sm font-semibold text-[#163832] transition hover:border-[#235347] hover:bg-[#f5f8f5]"
  >
    <FcGoogle className="h-5 w-5" aria-hidden="true" />
    {label}
  </a>
);

export default GoogleButton;
