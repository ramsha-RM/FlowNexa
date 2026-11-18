import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout as logoutRequest, profile } from "../services/auth.service.js";
import { FullPageLoader } from "../components/Loader.jsx";
import AuthContext from "./authContext.js";

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    profile()
      .then((response) => {
        if (active) setUser(response.user);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      navigate("/login", { replace: true, state: { expired: true } });
    };

    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [navigate]);

  const login = useCallback((nextUser) => setUser(nextUser), []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      setUser(null);
    }
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      updateUser: setUser,
    }),
    [user, loading, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {loading ? <FullPageLoader /> : children}
    </AuthContext.Provider>
  );
};
