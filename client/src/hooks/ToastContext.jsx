import { useCallback, useMemo, useState } from "react";
import Toast from "../components/Toast.jsx";
import ToastContext from "./toastContext.js";

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    id: 0,
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const close = useCallback(() => setToast((current) => ({ ...current, isOpen: false })), []);

  const notify = useCallback(
    (type, message, title) =>
      setToast({ id: Date.now(), isOpen: true, type, title, message }),
    [],
  );

  const value = useMemo(
    () => ({
      notify,
      success: (message, title) => notify("success", message, title),
      error: (message, title) => notify("error", message, title),
      info: (message, title) => notify("info", message, title),
      warning: (message, title) => notify("warning", message, title),
    }),
    [notify],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        key={toast.id}
        isOpen={toast.isOpen}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={close}
      />
    </ToastContext.Provider>
  );
};
