import { Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import "../style/color.css";
import "../style/auth.css";
import { TrendingUp } from "lucide-react";

const features = [
  "Track every application in one timeline",
  "Interview reminders that never slip",
  "Recommendations matched to your profile",
];

const AuthLayout = ({ children }) => (
  <main className="grid min-h-screen min-h-[100dvh] min-w-0 bg-[#f5f8f5] lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
    <section className="relative flex min-h-[50svh] min-w-0 flex-col overflow-hidden bg-gradient-to-br from-[#051F20] via-[#0B2B26] to-[#163832] px-5 py-6 text-white sm:px-10 sm:py-8 lg:min-h-screen lg:px-14 lg:py-10 xl:px-20 2xl:px-24">
      <div className="pointer-events-none absolute -right-32 -top-36 h-[440px] w-[440px] rounded-full border border-[#8EB69B]/15" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-[340px] w-[340px] rounded-full border border-[#8EB69B]/20" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-[#235347]/35 blur-3xl" />

      <Link
        to="/login"
        aria-label="FlowNexa home"
        className="relative z-10 inline-flex w-fit items-center gap-2"
      >
        <Logo tone="dark" showText={false} className="h-10 w-auto" />
        <span className="text-lg font-semibold text-white">FlowNexa</span>
      </Link>

      <div className="relative z-10 my-auto py-10 sm:py-12 lg:py-20">
        <div className="w-full max-w-[500px]">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#8EB69B]/30 bg-[#163832]/70 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#DAF1DE]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8EB69B]" />
            Your next chapter starts here
          </p>
          <h1 className="break-words text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-[#DAF1DE] sm:text-5xl xl:text-[58px]">
            Your job search,
            <br />
            <span className="text-[#8EB69B]">finally organised.</span>
          </h1>
          <p className="mt-6 max-w-[430px] text-sm leading-7 text-[#DAF1DE]/75 sm:text-base">
            Applications, interviews and recruiter activity—together in one
            calm, focused workspace.
          </p>

          <ul className="mt-9 space-y-4">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-3 text-sm text-[#DAF1DE]/90"
              >
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8EB69B]/15 text-[#8EB69B]"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <figure className="relative z-10 w-full max-w-[380px] rounded-2xl border border-[#DAF1DE]/15 bg-[#DAF1DE]/[0.07] p-4 shadow-[0_20px_55px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5">
        <div
          aria-hidden="true"
          className="mb-3 text-3xl leading-none text-[#8EB69B]"
        >
          “
        </div>
        <blockquote className="text-sm leading-6 text-[#DAF1DE]/90">
          "Your next opportunity starts with a smarter, more organized job
          search."
        </blockquote>

        <figcaption className="mt-5 flex items-center gap-3 border-t border-[#DAF1DE]/10 pt-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#235347]">
            <TrendingUp size={17} className="text-[#DAF1DE]" />
          </span>
          <span>
            <span className="block text-xs font-semibold text-[#DAF1DE]">
              Smarter Job Tracking
            </span>
            <span className="mt-1 block text-[11px] text-[#DAF1DE]/60">
              Stay Focused. Stay Organized.
            </span>
          </span>
        </figcaption>
      </figure>
    </section>

    <section className="relative flex min-h-[50svh] min-w-0 items-center justify-center overflow-hidden bg-[#f5f8f5] px-4 py-8 sm:px-10 sm:py-12 lg:min-h-screen lg:px-12 xl:px-16 2xl:px-24">
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-[#DAF1DE]/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-28 h-72 w-72 rounded-full bg-[#8EB69B]/10 blur-3xl" />
      <div className="relative w-full max-w-[440px] rounded-[28px] border border-[#e3ebe4] bg-white p-5 shadow-[0_28px_90px_rgba(5,31,32,0.10)] sm:p-10">
        {children}
      </div>
    </section>
  </main>
);

export default AuthLayout;
