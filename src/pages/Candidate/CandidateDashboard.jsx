import { useEffect, useState } from "react";
import { api } from "../../api.js";
import ProfileDropdown from "../../components/ProfileDropdown.jsx";
import NotificationBell from "../../components/NotificationBell.jsx";
import ApplicationWizardModal from "../../components/Candidate/ApplicationWizardModal.jsx";
import { meetsMinimumQualification, qualificationLabel, qualificationRank } from "../../utils/eligibility.js";

// Format an ISO date as a short relative ("3 days ago") or absolute string.
// Mirrors the existing UI copy on the candidate dashboard.
function relativeDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Just now";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString();
}

// Shape a backend item into the card format this dashboard renders. The
// backend's `Item` schema carries `title`, `description`, `price`, `tags`,
// `company_name`, `company_website`, `company_address`, `company_tax_id`,
// `is_published`, `created_at`, `updated_at`. `location` and `salary` are
// not in the schema today, so we leave `location` blank and surface
// `price > 0` as the salary string (0 falls through to "Not disclosed").
function shapeItemForFeed(item) {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const companyName = item.company_name || item.company?.name || "Company not specified";
  const rawLocation = item.location || item.address || item.company_address || "Amravati";
  return {
    id: item.id || item._id,
    title: item.title || "Untitled role",
    company: companyName,
    company_name: companyName,
    tags,
    location: rawLocation,
    workMode: item.work_mode || item.workMode || "",
    experienceLevel: item.experience_level || item.experienceLevel || "",
    min_eligibility: item.min_eligibility || "",
    distanceKm: Number(item.distance_km ?? item.distanceKm),
    badges: tags.length > 0 ? tags.slice(0, 3) : ["New"],
    salary:
      typeof item.price === "number" && item.price > 0
        ? `₹${item.price.toLocaleString("en-IN")}`
        : "Not disclosed",
    date: relativeDate(item.created_at),
    raw: item,
  };
}

export default function CandidateDashboard({ user, initialSearch = {}, onProfileClick, onDashboard, onJobs, onSettings, onLogout }) {
  const userId = user?.id || user?._id || "anon";

  const [profile, setProfile] = useState({});
  const [appCount, setAppCount] = useState(0);
  const [appliedJobIds, setAppliedJobIds] = useState(() => new Set());
  const [applyingJobIds, setApplyingJobIds] = useState(() => new Set());
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch.role || "");
  const [activeSearchQuery, setActiveSearchQuery] = useState(initialSearch.role || "");

  // Filters state
  const [datePosted, setDatePosted] = useState("all");
  const [distance, setDistance] = useState("any");
  const [workMode, setWorkMode] = useState("all");
  const [experience, setExperience] = useState(initialSearch.experience ? initialSearch.experience.toLowerCase().startsWith("fresher") ? "fresher" : initialSearch.experience.includes("3+") ? "senior" : "mid" : "all");
  const [locationQuery, setLocationQuery] = useState(initialSearch.location || "");

  useEffect(() => {
    setSearchQuery(initialSearch.role || "");
    setActiveSearchQuery(initialSearch.role || "");
    setLocationQuery(initialSearch.location || "");
  }, [initialSearch.role, initialSearch.location]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    setActiveSearchQuery(searchQuery.trim());
  }

  function handleResetFilters() {
    setWorkMode("all");
    setDatePosted("all");
    setDistance("any");
    setExperience("all");
    setLocationQuery("");
    setSearchQuery("");
    setActiveSearchQuery("");
  }

  // Live feed state — replaces the old hardcoded DEFAULT_JOBS list. The
  // dashboard now reflects the recruiters' posts (e.g. RAM's job) the
  // moment they're published, with no manual sync step.
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");

  // Load the candidate's local profile and application count alongside the
  // complete public jobs feed. The requests run independently;
  // profile fetch errors are non-fatal (the dashboard still works without
  // them) but a feed failure surfaces inline so the candidate knows.
  useEffect(() => {
    let cancelled = false;
    let jobsRequestVersion = 0;

    // Load local profile data for the profile widgets and application flow.
    try {
      const stored = JSON.parse(localStorage.getItem(`mcp_profile_${userId}`) || "{}");
      setProfile(stored);
    } catch (e) {
      console.error("Could not load profile", e);
    }

    // Load actual applications so job cards can mark already-applied roles.
    api.getApplications({ page: 1, size: 100 })
      .then((data) => {
        if (cancelled) return;
        const applications = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        const jobIds = applications
          .map((application) => application?.job_id)
          .filter(Boolean)
          .map((id) => String(id));
        setAppliedJobIds((current) => new Set([...current, ...jobIds]));
        setAppCount((current) => Math.max(current, applications.length));
      })
      // The initial state is already zero. Keeping it unchanged on a fetch
      // failure avoids overwriting a Quick Apply success that finishes first.
      .catch(() => {});

    // Reload when the tab regains focus so deletions from the recruiter/admin
    // workspace are reflected without requiring a full page reload.
    const loadPublishedJobs = () => {
      const requestVersion = ++jobsRequestVersion;
      setJobsLoading(true);
      setJobsError("");
      api.getPublicJobs({ page: 1, size: 100 })
      .then((data) => {
        if (cancelled || requestVersion !== jobsRequestVersion) return;
        const postedJobs = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
        setJobs(postedJobs.map((job) => shapeItemForFeed(job)));
      })
      .catch((err) => {
        if (cancelled || requestVersion !== jobsRequestVersion) return;
        setJobsError(err?.message || "Failed to load jobs");
        setJobs([]);
      })
      .finally(() => {
        if (!cancelled && requestVersion === jobsRequestVersion) setJobsLoading(false);
      });
    };
    loadPublishedJobs();
    window.addEventListener("focus", loadPublishedJobs);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadPublishedJobs);
    };
  }, [userId]);

  function openApplicationModal(job) {
    if (appliedJobIds.has(String(job.id)) || applyingJobIds.has(String(job.id))) return;
    setApplyError("");
    setSelectedJobForApply(job);
  }

  async function submitApplication({ cover_letter, resume_url }) {
    const job = selectedJobForApply;
    if (!job) return;
    const jobId = String(job.id);
    if (appliedJobIds.has(jobId) || applyingJobIds.has(jobId)) return;

    setApplyError("");
    setApplyingJobIds((current) => new Set(current).add(jobId));
    try {
      await api.createApplication({
        job_id: job.id,
        cover_letter,
        resume_url,
      });
      setAppliedJobIds((current) => new Set(current).add(jobId));
      setAppCount((current) => current + 1);
      setSelectedJobForApply(null);
      setApplySuccess(`Application submitted for ${job.title}.`);
    } catch (err) {
      setApplyError(err?.message || "Could not submit your application. Please try again.");
    } finally {
      setApplyingJobIds((current) => {
        const next = new Set(current);
        next.delete(jobId);
        return next;
      });
    }
  }

  // Profile completion percent calculation
  const calculateCompletion = () => {
    let score = 20; // Sourced from user account (full_name, email, phone)
    if (profile.dob) score += 15;
    if (profile.gender) score += 10;
    if (profile.highest_education?.degree) score += 15;
    if (profile.experience_level) score += 15;
    if (profile.skills?.length > 0) score += 15;
    if (profile.resume_url || profile.portfolio_url) score += 10;
    return Math.min(score, 100);
  };

  // Apply only the submitted query. A direct, case-insensitive substring
  // search makes the result predictable across title, company, description,
  // and individual skill/tag values.
  const candidateQualifications = [
    profile.highest_education?.degree,
    profile.highest_qualification,
    ...(Array.isArray(profile.education) ? profile.education.map((entry) => entry?.degree) : []),
    user?.highest_qualification,
  ].filter(Boolean);
  const candidateQualification = candidateQualifications.reduce((highest, current) =>
    qualificationRank(current) > qualificationRank(highest) ? current : highest, "");
  const candidateHasEducation = qualificationRank(candidateQualification) >= 0;

  const filteredJobs = jobs.filter(job => {
    const q = activeSearchQuery.toLowerCase().trim();
    const searchableFields = [
      job.title,
      job.company_name || job.company,
      job.raw?.description,
      ...(Array.isArray(job.tags) ? job.tags : []),
      ...(Array.isArray(job.raw?.skills) ? job.raw.skills : []),
    ].filter(Boolean).map((value) => String(value).toLowerCase());
    const matchesSearch = !q || searchableFields.some((value) => value.includes(q));
    const matchesLocation = !locationQuery.trim() || job.location.toLowerCase().includes(locationQuery.trim().toLowerCase());

    const rawCreatedAt = job.raw?.created_at || job.created_at;
    const createdAt = rawCreatedAt ? new Date(rawCreatedAt).getTime() : Date.now();
    const age = Date.now() - createdAt;
    // Search results should not disappear simply because a legacy/live job
    // has no timestamp or falls outside a sidebar date selection.
    const matchesDate = q || datePosted === "all" ||
      (datePosted === "today" && age <= 24 * 60 * 60 * 1000) ||
      (datePosted === "week" && age <= 7 * 24 * 60 * 60 * 1000) ||
      (datePosted === "month" && age <= 30 * 24 * 60 * 60 * 1000);

    const mode = job.workMode.toLowerCase().replace(/[-_]/g, " ");
    const matchesMode = workMode === "all" || mode === workMode.replace("-", " ");
    const experienceText = job.experienceLevel.toLowerCase();
    const matchesExperience = experience === "all" ||
      (experience === "fresher" && /fresher|entry|0-1/.test(experienceText)) ||
      (experience === "mid" && /mid|1-3|2-5/.test(experienceText)) ||
      (experience === "senior" && /senior|3\+|5\+/.test(experienceText));

    const matchesDistance = distance === "any" ||
      (Number.isFinite(job.distanceKm) && job.distanceKm <= Number(distance));
    // A stated minimum requires known candidate education. Jobs without a
    // minimum remain visible to candidates whose education is unspecified.
    const matchesEligibility = !job.min_eligibility || meetsMinimumQualification(candidateQualification, job.min_eligibility);

    return matchesSearch && matchesLocation && matchesDate && matchesDistance && matchesMode && matchesExperience && matchesEligibility;
  });
  return (
    <div className="min-h-screen bg-[var(--theme-cream)] text-slate-800 flex flex-col">
      
      {/* ── Dark Navy Header Bar ─────────────────────────────────────────── */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo.png"
                alt="MyCareerPath Logo"
                className="h-9 w-auto rounded-lg object-contain bg-white/10 p-0.5"
              />
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wider text-[var(--theme-orange)]">
                  My<span className="text-white">CareerPath</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Candidate
                </span>
              </div>
            </div>
            
            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-4">
              {["Home", "Jobs", "Job prep", "Contests", "Resume tools"].map((link) => (
                <button
                  key={link}
                  type="button"
                  onClick={link === "Home" ? onDashboard : link === "Jobs" ? onJobs : undefined}
                  className={`text-sm font-semibold transition hover:text-[var(--theme-orange)] ${
                    link === "Home" ? "text-[var(--theme-orange)] border-b-2 border-[var(--theme-orange)] pb-1 mt-1" : "text-slate-300"
                  }`}
                >
                  {link}
                </button>
              ))}
            </nav>
          </div>

          {/* Search bar & Profile */}
          <div className="flex items-center gap-4">
            <NotificationBell />
            
            {/* Search Box */}
            <div className="hidden" aria-hidden="true">
              <input
                id="candidate-job-search"
                name="jobSearch"
                autoComplete="off"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, skills, companies..."
                className="w-full rounded-lg bg-slate-800 border border-slate-700 text-sm text-white px-3 py-1.5 pl-8 outline-none focus:border-[var(--theme-orange)]"
              />
              <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
              <button type="submit" aria-label="Search jobs" className="ml-2 rounded-lg bg-[var(--theme-orange)] px-3 py-1.5 text-xs font-bold text-white">Search</button>
            </div>

            <ProfileDropdown
              user={user}
              onProfile={onProfileClick}
              onDashboard={onDashboard}
              onSettings={onSettings}
              onLogout={onLogout}
            />
          </div>

        </div>
      </header>

      {/* Main Grid Content */}
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── Left Filter Sidebar (1 Col) ─────────────────────────────────── */}
        <aside className="lg:col-span-1 space-y-5">
          <form
            className="w-full rounded-2xl border border-[var(--theme-border)] bg-white p-5 shadow-sm"
            onSubmit={handleSearchSubmit}
          >
            <label htmlFor="candidate-sidebar-job-search" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Search jobs</label>
            <input
              id="candidate-sidebar-job-search"
              name="jobSearch"
              autoComplete="off"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search jobs, skills, companies..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--theme-orange)] focus:ring-2 focus:ring-orange-100"
            />
            <button type="submit" className="mt-3 w-full rounded-lg bg-[var(--theme-orange)] px-3 py-2 text-sm font-bold text-white transition hover:opacity-90">Search</button>
          </form>
          <div className="bg-white rounded-2xl border border-[var(--theme-border)] p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="font-bold text-slate-800">Filter Jobs</h2>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[var(--theme-orange)] font-semibold hover:underline"
              >
                Clear all
              </button>
            </div>

            {/* Date Posted */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Date Posted</label>
              <select
                value={datePosted}
                onChange={(e) => setDatePosted(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm outline-none"
              >
                <option value="all">Anytime</option>
                <option value="today">Past 24 hours</option>
                <option value="week">Past week</option>
                <option value="month">Past month</option>
              </select>
            </div>

            {/* Distance */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Distance (from Amravati)</label>
              <select
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm outline-none"
              >
                <option value="any">Any distance</option>
                <option value="10">Within 10 km</option>
                <option value="30">Within 30 km</option>
                <option value="100">Within 100 km</option>
              </select>
            </div>

            {/* Work Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Work Mode</label>
              <div className="space-y-1.5">
                {["All", "Remote", "Hybrid", "On-site"].map((mode) => (
                  <label key={mode} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="workMode"
                      checked={workMode.toLowerCase() === mode.toLowerCase()}
                      onChange={() => setWorkMode(mode.toLowerCase())}
                      className="accent-[var(--theme-orange)]"
                    />
                    {mode}
                  </label>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Experience Level</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm outline-none"
              >
                <option value="all">All experience levels</option>
                <option value="fresher">Fresher / Entry level</option>
                <option value="mid">Mid-level (1-3 yrs)</option>
                <option value="senior">Senior (3+ yrs)</option>
              </select>
            </div>

          </div>
        </aside>

        {/* ── Center Job Cards (2 Cols) ───────────────────────────────────── */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--theme-navy)]">
              Eligible Jobs ({filteredJobs.length})
            </h2>
            <span className="text-xs text-slate-500">Filtered by your education and selected filters</span>
          </div>

          {applyError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{applyError}</p>}
          {applySuccess && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{applySuccess}</p>}

          {jobsLoading ? (
            <div className="bg-white rounded-2xl border border-[var(--theme-border)] p-8 text-center text-slate-500" aria-live="polite">
              <p className="text-sm font-semibold">Loading the latest jobs...</p>
            </div>
          ) : jobsError ? (
            <div className="bg-white rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700" role="alert">
              <p className="text-sm font-semibold">Could not load jobs.</p>
              <p className="text-xs text-red-500 mt-1">{jobsError}</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">{candidateHasEducation ? "No jobs meet your education and current filters" : "Add your education to see eligible jobs"}</h3>
              <p className="text-sm text-slate-500 mt-1">{candidateHasEducation ? "Jobs with minimum education requirements are shown when your profile meets them. Clear filters to broaden your results." : "Jobs with a minimum education requirement are hidden until you add your education to your profile."}</p>
              <div className="mt-4 flex justify-center gap-3">
                <button type="button" onClick={handleResetFilters} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">Clear Filters &amp; Search</button>
                {!candidateHasEducation && <button type="button" onClick={onProfileClick} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium">Add Education</button>}
              </div>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const jobId = String(job.id);
              const isApplied = appliedJobIds.has(jobId);
              const isApplying = applyingJobIds.has(jobId);
              return (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-[var(--theme-border)] p-5 shadow-sm hover:shadow-md transition flex items-start gap-4 relative overflow-hidden"
              >
                {/* Job Info */}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Actively Hiring
                  </span>
                  <h3 className="text-md font-bold text-slate-800 mt-1 truncate">{job.title}</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{job.company}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>📍 {job.location}</span>
                    <span>•</span>
                    <span>💰 {job.salary}</span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.badges.map(b => (
                      <span key={b} className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
                        {b}
                      </span>
                    ))}
                    {job.min_eligibility && <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">Education: {qualificationLabel(job.min_eligibility)}</span>}
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={() => openApplicationModal(job)}
                  disabled={isApplied || isApplying}
                  className={`absolute right-5 bottom-4 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm ${isApplied ? "cursor-not-allowed bg-emerald-100 text-emerald-700" : "bg-[var(--theme-navy)] text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"}`}
                >
                  {isApplied ? "Applied" : isApplying ? "Applying..." : "Apply now"}
                </button>
              </div>
              );
            })
          )}
        </section>

        {/* ── Right Profile Summary Sidebar (1 Col) ───────────────────────── */}
        <aside className="lg:col-span-1 space-y-5">
          
          {/* Profile Strength */}
          <div className="bg-white rounded-2xl border border-[var(--theme-border)] p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Profile Strength</h2>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Completeness</span>
              <span className="font-bold text-blue-600">{calculateCompletion()}%</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${calculateCompletion()}%` }}
              />
            </div>

            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs text-blue-800 font-semibold">
                Preferred Title:
              </p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                {profile.experience_level === "fresher"
                  ? "Aspirant / Fresh Graduate"
                  : profile.experience_level === "experienced"
                  ? "Senior Specialist"
                  : "Skilled Professional"}
              </p>
            </div>
            
            <button
              type="button"
              onClick={onProfileClick}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Manage Profile
            </button>
          </div>

          {/* Applications Widget */}
          <div className="bg-white rounded-2xl border border-[var(--theme-border)] p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2">My Activities</h2>
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div>
                <p className="text-2xl font-black text-[var(--theme-navy)]">{appCount}</p>
                <p className="text-xs text-slate-500 font-medium">Applied Jobs</p>
              </div>
              <span className="text-2xl">💼</span>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Active status updates will appear here when recruiters review your applications.
            </p>
          </div>

        </aside>

      </div>

      {selectedJobForApply && (
        <ApplicationWizardModal
          job={selectedJobForApply}
          profile={profile}
          user={user}
          submitting={applyingJobIds.has(String(selectedJobForApply.id))}
          error={applyError}
          onSubmit={submitApplication}
          onClose={() => setSelectedJobForApply(null)}
        />
      )}
      <footer className="border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-500">© 2026 MyCareerPath. All rights reserved.</footer>
    </div>
  );
}
