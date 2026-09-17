import { useEffect, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Users,
  XCircle,
} from "lucide-react";
import { api } from "../../api.js";

const monthLabel = (key) =>
  new Intl.DateTimeFormat("en", { month: "short" }).format(
    new Date(`${key}-01T00:00:00Z`),
  );

export default function ReportsEmployeeDashboard() {
  const [jobs, setJobs] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.getItems({ page: 1, size: 100 }),
      api.getApplications({ page: 1, size: 100 }),
      api.getMonthlyReports(),
    ])
      .then(([jobsData, appsData, monthsData]) => {
        if (cancelled) return;
        const rawJobs = Array.isArray(jobsData)
          ? jobsData
          : jobsData?.items || [];
        const apps = Array.isArray(appsData) ? appsData : appsData?.items || [];
        setMonths(Array.isArray(monthsData?.months) ? monthsData.months : []);
        setJobs(
          rawJobs.map((job) => {
            const jobApps = apps.filter(
              (app) => String(app.job_id) === String(job.id || job._id),
            );
            const total = jobApps.length;
            const shortlisted = jobApps.filter(
              (app) => app.status === "screening",
            ).length;
            const interviews = jobApps.filter(
              (app) => app.status === "interview",
            ).length;
            const hired = jobApps.filter(
              (app) => app.status === "hired",
            ).length;
            const rejected = jobApps.filter(
              (app) => app.status === "rejected",
            ).length;
            return {
              id: job.id || job._id,
              title: job.title,
              applications: total,
              shortlisted,
              interviews,
              hired,
              rejected,
              rate: total ? Math.round((hired / total) * 100) : 0,
            };
          }),
        );
      })
      .catch((err) => {
        if (!cancelled)
          setError(err?.message || "Failed to load report metrics.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalApplications = months.reduce((sum, month) => sum + month.count, 0);
  const totals = jobs.reduce(
    (sum, job) => ({
      interviews: sum.interviews + job.interviews,
      hired: sum.hired + job.hired,
      rejected: sum.rejected + job.rejected,
    }),
    { interviews: 0, hired: 0, rejected: 0 },
  );
  const cards = [
    {
      label: "Total Jobs",
      value: jobs.length,
      icon: BriefcaseBusiness,
      tone: "text-blue-600 bg-blue-50",
    },
    {
      label: "Total Applications",
      value: totalApplications,
      icon: Users,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Interviews",
      value: totals.interviews,
      icon: CalendarDays,
      tone: "text-violet-600 bg-violet-50",
    },
    {
      label: "Hired",
      value: totals.hired,
      icon: CheckCircle2,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Rejected",
      value: totals.rejected,
      icon: XCircle,
      tone: "text-red-600 bg-red-50",
    },
  ];
  const visibleJobs = showAll ? jobs : jobs.slice(0, 5);
  return <main className="reports-page min-h-screen bg-slate-50 text-slate-800"><div className="mx-auto max-w-7xl px-6 py-9"><header><p className="text-sm font-bold uppercase tracking-wide text-[var(--theme-orange)]">Analytics</p><h1 className="mt-1 text-3xl font-black text-[var(--theme-navy)]">Reports</h1><p className="mt-2 text-slate-500">Track your hiring funnel across every posting.</p></header>{error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{loading ? <p className="mt-6 rounded-2xl bg-white p-8 text-sm text-slate-500">Loading report metrics...</p> : <><section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(({ label, value, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={20} /></div><p className="mt-4 text-sm font-bold text-slate-600">{label}</p><p className="mt-1 text-3xl font-black text-[var(--theme-navy)]">{value}</p></article>)}</section><section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black text-[var(--theme-navy)]">Job Performance</h2><p className="mt-1 text-sm text-slate-500">Conversion rates from applications to hires.</p></div>{jobs.length > 5 && <button type="button" onClick={() => setShowAll((value) => !value)} className="text-sm font-bold text-[var(--theme-orange)]">{showAll ? "Show Top 5 Jobs <" : "View All Jobs Performance >"}</button>}</div>{jobs.length === 0 ? <p className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No job performance data available yet. Post a job and receive applications to view conversion rates.</p> : <div className="mt-5 overflow-x-auto"><table className="min-w-[700px] w-full text-left text-sm"><thead className="text-xs font-bold uppercase tracking-wide text-slate-500"><tr>{["Job", "Applications", "Shortlisted", "Interviews", "Hired", "Rejected", "Hire rate"].map((heading) => <th key={heading} className="border-b border-slate-100 px-3 py-3">{heading}</th>)}</tr></thead><tbody>{visibleJobs.map((job) => <tr key={job.id} className="border-b border-slate-100"><td className="px-3 py-4 font-bold text-[var(--theme-navy)]">{job.title || "Untitled job"}</td><td className="px-3 py-4">{job.applications}</td><td className="px-3 py-4">{job.shortlisted}</td><td className="px-3 py-4">{job.interviews}</td><td className="px-3 py-4">{job.hired}</td><td className="px-3 py-4">{job.rejected}</td><td className="px-3 py-4 font-bold text-emerald-700">{job.rate}%</td></tr>)}</tbody></table></div>}</section><section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-black text-[var(--theme-navy)]">Applications Overview</h2><div className="mt-5 grid grid-cols-7 items-end gap-3">{months.map((month) => <div key={month.key} className="text-center"><div className="mx-auto flex h-32 items-end justify-center"><div className="w-full max-w-10 rounded-t-md bg-[var(--theme-orange)]" style={{ height: `${Math.max(8, month.count ? (month.count / Math.max(...months.map((entry) => entry.count), 1)) * 100 : 8)}%` }} title={`${month.count} applications`} /></div><p className="mt-2 text-xs font-bold text-slate-500">{monthLabel(month.key)}</p></div>)}</div></section></>}</div></main>;
}
