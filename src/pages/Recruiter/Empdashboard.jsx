// Recruiter home dashboard — placeholder.
// Designed to slot into the existing `emp-dashboard` CSS hook in
// theme.css (see --emp-navy / --emp-orange / etc). Replace the
// inline copy and stat cards with real data once the API is wired up.

import { useEffect, useState } from "react";
import { BarChart3, BriefcaseBusiness, FileText, Search, UserPlus, CalendarDays } from "lucide-react";
import { api } from "../../api.js";

export default function Empdashboard({ user, onNavigate, refreshToken }) {
  const display = user?.full_name || user?.email || user?.phone || "there";
  const [metrics, setMetrics] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [applications, setApplications] = useState(null);
  const [metricsError, setMetricsError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setMetricsError("");
    Promise.all([
      api.getItems({ page: 1, size: 100 }),
      api.getApplications({ page: 1, size: 100 }),
      api.getRecruiterMetrics(),
    ])
      .then(([jobsData, applicationsData, reportData]) => {
        if (cancelled) return;
        setJobs(Array.isArray(jobsData?.items) ? jobsData.items : []);
        setApplications(Array.isArray(applicationsData) ? applicationsData : (applicationsData?.items || []));
        setMetrics(reportData);
      })
      .catch((err) => { if (!cancelled) setMetricsError(err?.message || "Could not load metrics"); });
    return () => { cancelled = true; };
  }, [refreshToken, refreshKey]);

  const metricValues = [
    { label: "Total Jobs", value: jobs?.length, icon: BriefcaseBusiness, tone: "bg-blue-50 text-blue-700", wave: "#dbeafe" },
    { label: "Active Jobs", value: metrics?.open_jobs ?? jobs?.filter((job) => job.is_published).length, icon: BarChart3, tone: "bg-emerald-50 text-emerald-700", wave: "#d1fae5" },
    { label: "Applications", value: applications?.length, icon: FileText, tone: "bg-amber-50 text-amber-700", wave: "#fef3c7" },
    { label: "Hired Candidates", value: metrics?.hires_this_month, icon: UserPlus, tone: "bg-rose-50 text-rose-700", wave: "#ffe4e6" },
  ];
  return (
    <main className="emp-dashboard min-h-screen bg-[var(--emp-bg)] text-slate-800">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-10">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--emp-orange)]">Overview</p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--emp-navy)]">
            Welcome back, {display}
          </h1>
          <p className="mt-2 text-slate-600">Here is what is happening across your hiring workspace.</p>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="mt-4 rounded-lg border border-[var(--emp-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--emp-navy)]">🔄 Refresh Data</button>
        </header>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid gap-4 sm:grid-cols-2">
            {metricValues.map((stat) => {
              const Icon = stat.icon;
              return <article key={stat.label} className={`relative min-h-40 overflow-hidden rounded-2xl border border-white bg-white p-5 shadow-sm ${stat.tone}`}>
                <div className="relative z-10 flex items-start justify-between">
                  <div><p className="text-xs font-bold uppercase tracking-wide opacity-80">{stat.label}</p><p className="mt-4 text-4xl font-black text-[var(--emp-navy)]">{stat.value ?? "..."}</p></div>
                  <span className="rounded-xl bg-white/80 p-3"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                </div>
                <svg className="absolute bottom-0 left-0 h-16 w-full opacity-80" viewBox="0 0 400 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 48 C90 8 130 72 220 35 C300 2 340 55 400 25 V80 H0Z" fill={stat.wave} /></svg>
              </article>;
            })}
          </div>
          <article className="rounded-2xl border border-[var(--emp-border)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--emp-navy)]">Quick Actions</h2>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => onNavigate?.("post-job")}
                className="flex w-full items-center gap-3 rounded-xl bg-[var(--emp-orange)] px-4 py-3 text-left text-sm font-bold text-white transition hover:brightness-95"
              >
                <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />Post New Job
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.("applications")}
                className="flex w-full items-center gap-3 rounded-xl bg-[var(--emp-orange)] px-4 py-3 text-left text-sm font-bold text-white transition hover:brightness-95"
              >
                <Search className="h-5 w-5" aria-hidden="true" />Search Candidates
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.("applications")}
                className="flex w-full items-center gap-3 rounded-xl bg-[var(--emp-orange)] px-4 py-3 text-left text-sm font-bold text-white transition hover:brightness-95"
              >
                <CalendarDays className="h-5 w-5" aria-hidden="true" />Schedule Interview
              </button>
            </div>
          </article>
        </section>
        {metricsError && <p className="mt-5 text-sm text-rose-600">{metricsError}</p>}
      </div>
    </main>
  );
}
