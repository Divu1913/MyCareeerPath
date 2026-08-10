import { useState } from "react";
import "./theme.css";
import EmpDashboard from "./pages/Recruiter/empdasboard";
import PostJobEmployeeDashboard from "./pages/Recruiter/PostJobEmployeeDashboard";
import ManageJobsEmployeeDashboard from "./pages/Recruiter/ManageJobsEmployeeDashboard";
import ApplicationsEmployeeDashboard from "./pages/Recruiter/ApplicationsEmployeeDashboard";
import ReportsEmployeeDashboard from "./pages/Recruiter/ReportsEmployeeDashboard";
import SettingsEmployeeDashboard from "./pages/Recruiter/SettingsEmployeeDashboard";
import LoggedOut from "./pages/Recruiter/LoggedOut";

export default function App() {
  const [page, setPage] = useState("dashboard");

  if (page === "post-job") return <PostJobEmployeeDashboard onNavigate={setPage} />;
  if (page === "manage-jobs") return <ManageJobsEmployeeDashboard onNavigate={setPage} />;
  if (page === "applications") return <ApplicationsEmployeeDashboard onNavigate={setPage} />;
  if (page === "interviews") return <ApplicationsEmployeeDashboard onNavigate={setPage} initialTab="Interview" />;
  if (page === "reports") return <ReportsEmployeeDashboard onNavigate={setPage} />;
  if (page === "settings-profile") return <SettingsEmployeeDashboard onNavigate={setPage} initialSection="My Profile" />;
  if (page === "settings-company") return <SettingsEmployeeDashboard onNavigate={setPage} initialSection="Company Profile" />;
  if (page === "settings") return <SettingsEmployeeDashboard onNavigate={setPage} />;
  if (page === "logged-out") return <LoggedOut onNavigate={setPage} />;
  return <EmpDashboard onNavigate={setPage} />;
}
