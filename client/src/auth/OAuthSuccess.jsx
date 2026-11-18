import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FullPageLoader } from "../components/Loader.jsx";
import { profile } from "../services/auth.service.js";
import { useAuth } from "../hooks/useAuth.js";

const OAuthSuccess = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    profile()
      .then((response) => {
        if (!active) return;
        login(response.user);
        navigate("/", { replace: true });
      })
      .catch(() => {
        if (active) navigate("/login?error=Google%20sign-in%20failed.%20Please%20try%20again", { replace: true });
      });

    return () => {
      active = false;
    };
  }, [login, navigate]);

  return <FullPageLoader />;
};

export default OAuthSuccess;
