import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { buttonClass, eyebrowClass, mutedClass } from "../style/classes.js";

const NotFound = () => {
  useDocumentTitle("Page not found");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f8f5] px-6 text-center">
      <p className={eyebrowClass}>Error 404</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#051F20]">Page not found</h1>
      <p className={`mt-3 max-w-sm ${mutedClass}`}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className={`${buttonClass} mt-8`}>
        Back to FlowNexa
      </Link>
    </main>
  );
};

export default NotFound;

