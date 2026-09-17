import { useEffect, useRef, useState } from "react";
import "./theme.css";
import LandingPage from "./LandingPage";
import JobsPage from "./JobsPage";
import AuthForm from "./src/AuthForm";
import ChatDialog from "./src/ChatDialog";
import { api, auth } from "./src/api.js";
import Empdashboard from "./src/pages/Recruiter/Empdashboard";
import PostJobEmployeeDashboard from "./src/pages/Recruiter/PostJobEmployeeDashboard";
import ManageJobsEmployeeDashboard from "./src/pages/Recruiter/ManageJobsEmployeeDashboard";
import ApplicationsEmployeeDashboard from "./src/pages/Recruiter/ApplicationsEmployeeDashboard";
import ReportsEmployeeDashboard from "./src/pages/Recruiter/ReportsEmployeeDashboard";
import SettingsEmployeeDashboard from "./src/pages/Recruiter/SettingsEmployeeDashboard";
import RecruiterOnboarding from "./src/pages/Recruiter/RecruiterOnboarding";
import LoggedOut from "./src/pages/Recruiter/LoggedOut";
import UserProfile from "./src/pages/Candidate/UserProfile";
import CandidateOnboarding from "./src/pages/Candidate/CandidateOnboarding";
import CandidateDashboard from "./src/pages/Candidate/CandidateDashboard";
import JobsExplorer from "./src/pages/Candidate/JobsExplorer";
import AccountSettings from "./src/pages/Candidate/AccountSettings";
import ProfileDropdown from "./src/components/ProfileDropdown";
import AdminLoginModal from "./src/components/AdminLoginModal";
import LandingFooter from "./src/components/Footer";
// Admin dashboard components
import AdminSidebar from "./mycareerpath-admin/src/components/Sidebar.jsx";
import AdminTopbar from "./mycareerpath-admin/src/components/Topbar.jsx";
import AdminDashboard from "./mycareerpath-admin/src/views/Dashboard.jsx";
import AdminUsers from "./mycareerpath-admin/src/views/Users.jsx";
import AdminApprovals from "./mycareerpath-admin/src/views/Approvals.jsx";
import AdminJobs from "./mycareerpath-admin/src/views/Jobs.jsx";
import AdminActivity from "./mycareerpath-admin/src/views/Activity.jsx";
import AdminReports from "./mycareerpath-admin/src/views/Reports.jsx";
import AdminSystem from "./mycareerpath-admin/src/views/System.jsx";
import "./mycareerpath-admin/src/App.css";
import { Bell, BriefcaseBusiness, FileText, LayoutDashboard, Plus, Settings, Users, BarChart3, CalendarDays } from "lucide-react";


// Top-level page state. No router yet — matches the existing minimal style.
// `page` is the top-level shell (landing | jobs | auth | dashboard | logged-out).
// `recruiterView` is the sub-page once the user is on the dashboard:
//   overview | post-job | manage-jobs | applications | reports | settings.
const RECRUITER_VIEWS = {
  "overview": Empdashboard,
  "post-job": PostJobEmployeeDashboard,
  "manage-jobs": ManageJobsEmployeeDashboard,
  "applications": ApplicationsEmployeeDashboard,
  "reports": ReportsEmployeeDashboard,
  "settings": SettingsEmployeeDashboard,
};

const ADMIN_VIEWS = {
  "dashboard": AdminDashboard,
  "users": AdminUsers,
  "approvals": AdminApprovals,
  "jobs": AdminJobs,
  "activity": AdminActivity,
  "reports": AdminReports,
  "system": AdminSystem,
};

const RECRUITER_NAV = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "post-job", label: "Post Job", icon: Plus },
  { key: "manage-jobs", label: "Manage Jobs", icon: BriefcaseBusiness },
  { key: "applications", label: "Applications", icon: FileText },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
];

const RECRUITER_TOP_NAV = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "manage-jobs", label: "Jobs", icon: BriefcaseBusiness },
  { key: "applications", label: "Candidates", icon: Users },
  { key: "applications", label: "Interviews", icon: CalendarDays },
  { key: "reports", label: "Reports", icon: BarChart3 },
];

export default function App() {
  // Default page is ALWAYS "landing" on mount. The app never force-redirects
  // a visitor (logged in or not) to onboarding or dashboard without explicit
  // user action. Brand logo / "Back to Home" links should reset `page` to
  // "landing" via the `goHome` helper below.
  const [page, setPageState] = useState("landing"); // landing | jobs | auth | dashboard | logged-out | candidate-settings
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("signin");
  const [authRole, setAuthRole] = useState("candidate");
  const [recruiterView, setRecruiterViewState] = useState("overview");
  const [adminView, setAdminViewState] = useState("dashboard");
  const [recruiterSettingsSection, setRecruiterSettingsSection] = useState("profile");
  const [applicationFilter, setApplicationFilter] = useState("");
  const [jobSearch, setJobSearch] = useState({ role: "", experience: "", location: "" });
  // Bump this counter to tell `ManageJobsEmployeeDashboard` to refetch
  // (e.g. after a successful create in `PostJobEmployeeDashboard`).
  const [jobsRefreshToken, setJobsRefreshToken] = useState(0);
  // Lifted to App so the floating chat button is available on every
  // view. ChatDialog is kept mounted (just hidden when isOpen=false)
  // so its conversation history survives the toggle.
  const [chatOpen, setChatOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  // Mirror of the latest `me` payload, kept in a ref so synchronous
  // event-handler closures (e.g. LandingPage's "Go to Dashboard" button
  // clicked before React re-renders) always read the freshest profile
  // when calling `destinationForUser`. Without this, `user` state can
  // be one render stale and route the candidate to onboarding even
  // though `handleAuthSuccess` already routed them to the dashboard.
  const meRef = useRef(null);

  function routeHash(nextPage, nextRecruiterView = recruiterView, nextAdminView = adminView) {
    if (nextPage !== "dashboard") return `#${nextPage}`;
    if (user?.role === "admin" || meRef.current?.role === "admin") return `#dashboard/admin/${nextAdminView}`;
    return `#dashboard/recruiter/${nextRecruiterView}`;
  }

  function setPage(nextPage) {
    setPageState(nextPage);
    if (nextPage === page) return;
    if (window.location.hash !== routeHash(nextPage)) {
      window.history.pushState(null, "", routeHash(nextPage));
    }
  }

  function setRecruiterView(nextView) {
    setRecruiterViewState(nextView);
    if (page === "dashboard" && user?.role !== "admin") {
      const nextHash = routeHash("dashboard", nextView, adminView);
      if (window.location.hash !== nextHash) window.history.pushState(null, "", nextHash);
    }
  }

  function setAdminView(nextView) {
    setAdminViewState(nextView);
    if (page === "dashboard" && (user?.role === "admin" || meRef.current?.role === "admin")) {
      const nextHash = routeHash("dashboard", recruiterView, nextView);
      if (window.location.hash !== nextHash) window.history.pushState(null, "", nextHash);
    }
  }

  // Always-on "go home" handler — used by brand logos and "Back to Home"
  // links. Returns the user to the landing page from any sub-view.
  const goHome = () => setPage("landing");

  // A candidate is considered "onboarded" when EITHER:
  //   (a) the backend `me` payload (returned by /api/v1/auth/me from MongoDB)
  //       already carries one of the onboarding signals — `full_name`,
  //       `experience_level`, or a non-empty `skills[]` — meaning the user
  //       has profile data persisted server-side; OR
  //   (b) the local `mcp_profile_${userId}` cache says `onboarding_complete`
  //       (written by `CandidateOnboarding.handleFinish`).
  // Only when BOTH sources are blank do we route back to the wizard. This
  // means a user who finished onboarding on one device (local flag) still
  // sees the dashboard if they sign in elsewhere (local cache empty), as
  // long as the backend `me` payload shows profile data — and conversely a
  // returning user with a blank MongoDB profile but a complete local cache
  // skips the wizard too.
  const hasServerProfileData = (me) => {
    if (!me || typeof me !== "object") return false;
    if (typeof me.full_name === "string" && me.full_name.trim().length > 0) {
      return true;
    }
    if (
      typeof me.experience_level === "string" &&
      me.experience_level.trim().length > 0
    ) {
      return true;
    }
    if (Array.isArray(me.skills) && me.skills.length > 0) {
      return true;
    }
    return false;
  };

  const hasLocalProfileData = (stored) => {
    if (!stored || typeof stored !== "object") return false;
    if (Boolean(stored.onboarding_complete)) return true;
    if (
      typeof stored.experience_level === "string" &&
      stored.experience_level.trim().length > 0
    ) {
      return true;
    }
    if (Array.isArray(stored.skills) && stored.skills.length > 0) {
      return true;
    }
    return false;
  };

  const isProfileComplete = (me, stored) =>
    hasServerProfileData(me) || hasLocalProfileData(stored);

  // Post-auth destination map (pure, no side effects):
  //   candidate + any profile signal -> "candidate-dashboard"
  //   candidate + completely blank in db AND no local cache
  //                                      -> "candidate-onboarding"
  //   recruiter + incomplete verification -> "recruiter-onboarding"
  //   recruiter with verification / admin -> "dashboard"
  //   anything else (defensive)         -> "landing"
  // Centralising this here keeps `handleAuthSuccess` and the header's
  // "Go to Dashboard" CTA in sync — both call `destinationForUser(user)`
  // so a logged-in user always lands somewhere sensible regardless of which
  // entry point they used.
  const destinationForUser = (me) => {
    if (!me) return "landing";
    const role = me.role;
    if (role === "candidate") {
      const userId = me.id || me._id;
      let stored = {};
      try {
        stored = JSON.parse(
          localStorage.getItem(`mcp_profile_${userId}`) || "{}"
        );
      } catch {
        stored = {};
      }
      return isProfileComplete(me, stored)
        ? "candidate-dashboard"
        : "candidate-onboarding";
    }
    if (role === "recruiter") {
      const hasCompanyVerification = [
        me.company_name,
        me.company_website,
        me.company_address,
        me.company_tax_id,
      ].every((value) => typeof value === "string" && value.trim().length > 0);
      return hasCompanyVerification ? "dashboard" : "recruiter-onboarding";
    }
    if (role === "admin") return "dashboard";
    return "landing";
  };

  // On mount, restore the role-appropriate authenticated view after a hard refresh.
  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      if (!auth.isAuthenticated()) return;
      try {
        const me = await api.me();
        if (!cancelled) {
          setUser(me);
          // Keep `meRef` in sync so synchronous handlers (e.g.
          // `onDashboard` on LandingPage) read the freshest payload
          // even before the next render flushes `user` state.
          meRef.current = me;
          setPage(destinationForUser(me));
        }
      } catch {
        // Token invalid — clear and stay logged out.
        auth.clear();
      }
    }
    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  // Restore page and dashboard sub-view state from browser history/hash.
  useEffect(() => {
    const syncHistory = () => {
      const parts = window.location.hash.replace(/^#/, "").trim().toLowerCase().split("/").filter(Boolean);
      if (!parts.length || parts[0] === "home") {
        setPageState("landing");
        return;
      }
      if (parts[0] === "dashboard") {
        setPageState("dashboard");
        if (parts[1] === "admin" && parts[2]) setAdminViewState(parts[2]);
        if (parts[1] === "recruiter" && parts[2]) setRecruiterViewState(parts[2]);
        return;
      }
      setPageState(parts[0]);
    };

    syncHistory();
    window.addEventListener("popstate", syncHistory);
    window.addEventListener("hashchange", syncHistory);
    return () => {
      window.removeEventListener("popstate", syncHistory);
      window.removeEventListener("hashchange", syncHistory);
    };
  }, []);

  function handleAuthSuccess() {
    setRecruiterView("overview");
    // Pass the freshly fetched `me` straight into `destinationForUser` so
    // sign-in triggers an instant redirect to:
    //   - "candidate-onboarding" if role=candidate AND no profile signals
    //   - "candidate-dashboard"  if role=candidate AND profile is complete
    //   - "recruiter-onboarding" if role=recruiter AND verification is incomplete
    //   - "dashboard"            if role=recruiter with verification OR role=admin
    //   - "landing"              as a defensive fallback only
    // This avoids the one-render-stale pitfall where the LandingPage
    // "Go to Dashboard" CTA reads the pre-login `user === null` from state.
    api.me().then((me) => {
      setUser(me);
      meRef.current = me;
      setPage(destinationForUser(me));
    }).catch(() => setPage("landing"));
  }

  function handleLogout() {
    auth.clear();
    setUser(null);
    meRef.current = null;
    setPage("logged-out");
  }

  function handleAccountDeleted() {
    const userId = user?.id || user?._id;
    auth.clear();
    if (userId) localStorage.removeItem(`mcp_profile_${userId}`);
    setUser(null);
    meRef.current = null;
    setPage("logged-out");
  }

  function openAuth(mode = "signin", role = "candidate") {
    setAuthMode(mode);
    setAuthRole(role);
    setPage("auth");
  }

  function handleRecruiterNav(view, filter = "") {
    if (user?.role === "admin") {
      setAdminView("dashboard");
      setPage("dashboard");
      return;
    }
    setRecruiterView(view);
    setApplicationFilter(filter);
    setPage("dashboard");
  }

  function handleAdminNav(view) {
    setAdminView(view);
    setPage("dashboard");
  }

  // "My Profile" has different destinations for each account type. Candidate
  // data belongs in UserProfile; recruiters manage their company and contact
  // details in the recruiter settings workspace.
  function openProfileForUser(account = user) {
    if (account?.role === "candidate") {
      setPage("candidate-profile");
      return;
    }
    if (account?.role === "recruiter" || account?.role === "admin") {
      setRecruiterSettingsSection("profile");
      setRecruiterView("settings");
      setPage("dashboard");
    }
  }

  function openSettingsForUser(account = user) {
    if (account?.role === "recruiter" || account?.role === "admin") {
      setRecruiterSettingsSection("security");
      setRecruiterView("settings");
      setPage("dashboard");
      return;
    }
    if (account?.role === "candidate") setPage("candidate-settings");
    if (account?.role === "candidate") setPage("candidate-profile");
  }

  // Render chrome (floating chat button + dialog) that overlays every
  // view. The button is hidden while the dialog is open so it doesn't
  // double up; the dialog stays mounted (just hidden) so reopening it
  // restores the conversation.
  const chatRole = user?.role || (auth.isAuthenticated() ? "user" : "guest");
  const chrome = (
    <>
      <ChatDialog
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        userRole={chatRole}
      />
      {!chatOpen && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          aria-label="Open AI assistant"
          title="Open AI assistant"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-orange)] text-white shadow-lg ring-1 ring-black/5 transition hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--theme-navy)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
      )}
    </>
  );

  if (page === "auth")
    return (
      <>
        <AuthForm
          onSuccess={handleAuthSuccess}
          onHome={goHome}
          initialMode={authMode}
          initialRole={authRole}
        />
        {chrome}
      </>
    );

  // Jobseeker view — landing + jobs explorer wired up
  if (page === "jobs")
    return (
      <>
        <JobsExplorer
          initialQuery={jobSearch.role}
          initialFilters={{ experience: jobSearch.experience, location: jobSearch.location }}
          onBack={() => setPage(user ? destinationForUser(user) : "landing")}
        />
        {chrome}
      </>
    );

  if (page === "logged-out")
    return (
      <>
        <LoggedOut
          onSignIn={() => openAuth("signin")}
          onHome={() => setPage("landing")}
        />
        {chrome}
      </>
    );

  // Candidate onboarding wizard. `onComplete` always forwards the user to
  // the candidate dashboard — never back to the landing page — so that
  // finishing the wizard never loses the session context. The freshly
  // persisted user (returned by CandidateOnboarding.handleFinish via
  // `api.updateProfile`) is merged into both `user` state and `meRef` so
  // the destination helper, header CTA, and any subsequent render all
  // see the updated profile.
  if (page === "candidate-onboarding")
    return (
      <>
        <CandidateOnboarding
          user={user}
          onBack={goHome}
          onComplete={(updatedUser) => {
            const next = updatedUser || user;
            setUser(next);
            meRef.current = next;
            setPage("candidate-dashboard");
          }}
        />
        {chrome}
      </>
    );

  if (page === "recruiter-onboarding")
    return (
      <>
        <RecruiterOnboarding
          user={user}
          onLogout={handleLogout}
          onComplete={(updatedUser) => {
            const next = updatedUser || user;
            setUser(next);
            meRef.current = next;
            setRecruiterView("overview");
            setPage("dashboard");
          }}
        />
        {chrome}
      </>
    );

  // Candidate dashboard
  if (page === "candidate-dashboard")
    return (
      <>
        <CandidateDashboard
          user={user}
          initialSearch={jobSearch}
          onProfileClick={() => setPage("candidate-profile")}
          onDashboard={() => setPage("candidate-dashboard")}
          onJobs={() => setPage("jobs")}
          onSettings={() => setPage("candidate-profile")}
          onLogout={handleLogout}
        />
        {chrome}
      </>
    );

  if (page === "candidate-settings")
    return (
      <>
        <AccountSettings
          user={user}
          onBack={() => setPage("candidate-dashboard")}
          onDeleteAccount={handleAccountDeleted}
        />
        {chrome}
      </>
    );

  // Candidate profile — shown when user.role === "candidate" after login,
  // or when recruiter/admin clicks "My Profile" from the dashboard.
  if (page === "candidate-profile")
    return (
      <>
        <UserProfile
          user={user}
          onBack={() => setPage(user?.role !== "candidate" ? "dashboard" : "candidate-dashboard")}
          onProfile={() => setPage("candidate-profile")}
          onDashboard={() => setPage(user?.role !== "candidate" ? "dashboard" : "candidate-dashboard")}
          onSettings={() => setPage("candidate-profile")}
          onLogout={handleLogout}
          onUpdateUser={(updated) => setUser(updated)}
          onDeleteAccount={handleAccountDeleted}
        />
        {chrome}
      </>
    );

  // Dashboard (admin or recruiter) — overview + sub-pages
  if (page === "dashboard") {
    // Admin shell
    if (user?.role === "admin") {
      const AdminActiveView = ADMIN_VIEWS[adminView] || AdminDashboard;
      const display = user?.full_name || user?.email || user?.phone || "Administrator";
      
      return (
        <>
          <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fafaf9" }}>
            <AdminSidebar active={adminView} onNavigate={handleAdminNav} user={user} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <AdminTopbar 
                title={adminView.charAt(0).toUpperCase() + adminView.slice(1)} 
                subtitle="Platform administration"
                user={{ full_name: display }}
                onLogout={handleLogout}
              />
              <div style={{ flex: 1, overflow: "auto", padding: "2rem" }}>
                <AdminActiveView user={user} />
              </div>
              <footer style={{ borderTop: "1px solid #e7e5e4", padding: "0.75rem", textAlign: "center", fontSize: "0.75rem", color: "#64748b" }}>© 2026 MyCareerPath. All rights reserved.</footer>
            </div>
          </div>
          {chrome}
        </>
      );
    }

    // Recruiter shell
    const display = user?.full_name || user?.email || user?.phone;
    const company = user?.company_name || "MyCareerPath Recruiter";
    const ActiveView = RECRUITER_VIEWS[recruiterView] || Empdashboard;

    return (
      <>
        <div className="min-h-screen bg-[var(--theme-cream)]">
          <header className="flex min-h-[78px] items-center justify-between gap-4 border-b border-[var(--theme-border)] bg-white px-5 py-3 lg:px-8">
            <div className="flex shrink-0 items-center gap-3">
              <img
                src="/assets/logo.png"
                alt="MyCareerPath Logo"
                className="h-10 w-auto rounded-lg object-contain shadow-xs"
              />
              <div className="hidden sm:block">
                <p className="text-base font-black tracking-tight text-[var(--theme-navy)]">MyCareerPath</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-orange)]">Recruiter</p>
              </div>
            </div>
            <nav className="hidden items-center gap-1 xl:flex" aria-label="Recruiter workspace">
              {RECRUITER_TOP_NAV.map((item, index) => {
                const Icon = item.icon;
                const active = recruiterView === item.key && index !== 3;
                return (
                  <button key={`${item.key}-${item.label}`} type="button" onClick={() => handleRecruiterNav(item.key, item.label === "Interviews" ? "interview" : "")} className={`flex items-center gap-2 border-b-2 px-3 py-5 text-sm font-bold transition ${active ? "border-[var(--theme-orange)] text-[var(--theme-navy)]" : "border-transparent text-slate-500 hover:text-[var(--theme-navy)]"}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />{item.label}
                  </button>
                );
              })}
            </nav>
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Notifications" title="Notifications" className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[var(--theme-navy)]">
                <Bell className="h-5 w-5" aria-hidden="true" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--theme-orange)]" />
              </button>
              <div className="hidden text-right sm:block">
                <p className="max-w-32 truncate text-sm font-bold text-[var(--theme-navy)]">{display || "Recruiter"}</p>
                <p className="max-w-32 truncate text-[11px] text-slate-500">{company}</p>
              </div>
              <ProfileDropdown
                user={{ ...user, company_name: company }}
                onProfile={() => openProfileForUser(user)}
                onDashboard={() => setRecruiterView("overview")}
                onSettings={() => { setRecruiterSettingsSection("security"); setRecruiterView("settings"); }}
                onLogout={handleLogout}
              />
            </div>
          </header>
          <nav className="flex gap-1 overflow-x-auto border-b border-[var(--theme-border)] bg-white px-3 py-2 md:hidden" aria-label="Mobile recruiter navigation">
            {RECRUITER_NAV.map((item) => {
              const Icon = item.icon;
              const active = recruiterView === item.key;
              return (
                <button key={item.key} type="button" onClick={() => setRecruiterView(item.key)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${active ? "bg-[var(--theme-orange)] text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />{item.label}
                </button>
              );
            })}
          </nav>
          <div className="flex min-h-[calc(100vh-78px)]">
            <aside className="emp-sidebar hidden w-64 shrink-0 flex-col px-4 py-7 text-white md:flex">
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">Workspace</p>
              <nav className="mt-5 space-y-2" aria-label="Recruiter navigation">
                {RECRUITER_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = recruiterView === item.key;
                  return (
                    <button key={item.key} type="button" onClick={() => setRecruiterView(item.key)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${active ? "bg-[var(--theme-orange)] text-white shadow-lg shadow-orange-950/20" : "text-blue-100 hover:bg-white/10 hover:text-white"}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />{item.label}
                    </button>
                  );
                })}
              </nav>
              <div className="mt-auto rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs font-bold text-white">{display || "Recruiter"}</p>
                <p className="mt-1 truncate text-xs text-blue-200">{company}</p>
              </div>
            </aside>
            <div className="min-w-0 flex-1">
              <ActiveView
                user={user}
                initialSection={recruiterSettingsSection}
                initialFilter={recruiterView === "applications" ? applicationFilter : ""}
                onUpdateUser={(updatedUser) => {
                  setUser(updatedUser);
                  meRef.current = updatedUser;
                }}
                onDeleteAccount={handleAccountDeleted}
                onNavigate={setRecruiterView}
                onCancel={() => setRecruiterView("overview")}
                onCreated={() => {
                  setJobsRefreshToken((n) => n + 1);
                  setRecruiterView("manage-jobs");
                }}
                refreshToken={jobsRefreshToken}
              />
            </div>
          </div>
          <footer className="border-t border-[var(--theme-border)] bg-white px-5 py-3 text-center text-xs text-slate-500">© 2026 MyCareerPath. All rights reserved.</footer>
        </div>
        {chrome}
      </>
    );
  }

  // Unknown, null, and initial page states all resolve to the public landing
  // view so App never renders an empty tree.
  return (
    <>
      <LandingPage
        onLogin={() => openAuth("signin")}
        onRegister={() => openAuth("signup")}
        onRecruiters={() => openAuth("signin", "recruiter")}
        onExploreCategorySelect={() => setPage("jobs")}
        onSearch={(criteria) => { setJobSearch(criteria); setPage(user?.role === "candidate" ? "candidate-dashboard" : "jobs"); }}
        user={user}
        onProfile={() => openProfileForUser(user)}
        onDashboard={() => setPage(destinationForUser(meRef.current || user))}
        onSettings={() => openSettingsForUser(user)}
        onLogout={handleLogout}
        onOpenAdminLogin={() => setShowAdminLogin(true)}
      />
      <LandingFooter onOpenAdminLogin={() => setShowAdminLogin(true)} />
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onSuccess={handleAuthSuccess}
      />
      {chrome}
    </>
  );
}
