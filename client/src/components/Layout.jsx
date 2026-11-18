import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import VerifyBanner from "./VerifyBanner.jsx";
import { PageLoader } from "./Loader.jsx";

const Layout = () => (
  <div className="flex min-h-screen min-h-[100dvh] min-w-0 flex-col bg-[#f5f8f5]">
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#0B2B26] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
    >
      Skip to content
    </a>
    <Navbar />
    <VerifyBanner />
    <main id="main" className="app-container app-main min-w-0 flex-1">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </main>
    <footer className="border-t border-[#e3ebe4] bg-white py-6 text-center text-xs text-[#52675d]">
      © {new Date().getFullYear()} FlowNexa. All rights reserved.
    </footer>
  </div>
);

export default Layout;

