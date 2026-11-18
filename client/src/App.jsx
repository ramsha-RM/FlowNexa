import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import GuestRoute from "./components/GuestRoute.jsx";
import Login from "./auth/Login.jsx";
import Register from "./auth/Register.jsx";
import ForgotPassword from "./auth/ForgotPassword.jsx";
import ResetPassword from "./auth/ResetPassword.jsx";
import VerifyEmail from "./auth/VerifyEmail.jsx";
import OAuthSuccess from "./auth/OAuthSuccess.jsx";
import NotFound from "./pages/NotFound.jsx";

const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Jobs = lazy(() => import("./pages/Jobs.jsx"));
const JobDetails = lazy(() => import("./pages/JobDetails.jsx"));
const MyApplications = lazy(() => import("./pages/MyApplications.jsx"));
const ManageJobs = lazy(() => import("./pages/ManageJobs.jsx"));
const JobForm = lazy(() => import("./pages/JobForm.jsx"));
const Applicants = lazy(() => import("./pages/Applicants.jsx"));
const AdminUsers = lazy(() => import("./pages/AdminUsers.jsx"));
const AdminApplications = lazy(() => import("./pages/AdminApplications.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));

const App = () => (
  <Routes>
    <Route element={<GuestRoute />}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Route>

    <Route path="/signup" element={<Navigate to="/register" replace />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/verify-email" element={<VerifyEmail />} />
    <Route path="/oauth-success" element={<OAuthSuccess />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetails />} />
        <Route path="profile" element={<Profile />} />

        <Route element={<ProtectedRoute roles={["candidate"]} />}>
          <Route path="my-applications" element={<MyApplications />} />
        </Route>

        <Route element={<ProtectedRoute roles={["employer"]} />}>
          <Route path="employer/jobs" element={<ManageJobs />} />
          <Route path="employer/jobs/new" element={<JobForm />} />
        </Route>

        <Route element={<ProtectedRoute roles={["employer", "admin"]} />}>
          <Route path="employer/jobs/:id/edit" element={<JobForm />} />
          <Route path="employer/jobs/:id/applicants" element={<Applicants />} />
        </Route>

        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/jobs" element={<ManageJobs admin />} />
          <Route path="admin/applications" element={<AdminApplications />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
