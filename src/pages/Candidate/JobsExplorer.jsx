import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";

const DEFAULT_FILTERS = { datePosted: "all", category: "all", distance: "any", workMode: "all", experience: "all" };

function normalizeJob(item) {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  return {
    ...item,
    id: item.id || item._id,
    company: item.company_name || item.company?.name || "Company not specified",
    location: item.location || item.address || item.company_address || "Amravati",
    category: item.category || tags[0] || "Other",
    workMode: item.work_mode || item.workMode || "",
    experience: item.experience_level || item.experienceLevel || "",
    distanceKm: Number(item.distance_km ?? item.distanceKm),
    tags,
  };
}

function matchesDate(value, filter) {
  if (filter === "all") return true;
  const age = Date.now() - new Date(value || 0).getTime();
  const days = filter === "today" ? 1 : filter === "week" ? 7 : 30;
  return age >= 0 && age <= days * 24 * 60 * 60 * 1000;
}

export default function JobsExplorer({ initialQuery = "", initialFilters = {}, onBack }) {
  const [jobs, setJobs] = useState([]);
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, experience: initialFilters.experience ? initialFilters.experience.toLowerCase().startsWith("fresher") ? "fresher" : initialFilters.experience.includes("3+") ? "senior" : "mid" : "all", location: initialFilters.location || "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getPublicJobs({ page: 1, size: 100 })
      .then((data) => { if (!cancelled) setJobs((data?.items || []).map(normalizeJob)); })
      .catch((err) => { if (!cancelled) setError(err?.message || "Could not load active jobs."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const categories = [...new Set(jobs.map((job) => job.category).filter(Boolean))].sort();
  const filteredJobs = useMemo(() => {
    const search = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const haystack = [job.title, job.company, job.location, job.category, ...job.tags].join(" ").toLowerCase();
      const mode = job.workMode.toLowerCase().replace(/[-_]/g, " ");
      const experience = job.experience.toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      const matchesLocation = !filters.location || job.location.toLowerCase().includes(filters.location.trim().toLowerCase());
      const matchesCategory = filters.category === "all" || job.category.toLowerCase() === filters.category.toLowerCase();
      const matchesMode = filters.workMode === "all" || mode === filters.workMode.replace("-", " ");
      const matchesExperience = filters.experience === "all" ||
        (filters.experience === "fresher" && /fresher|entry|0-1/.test(experience)) ||
        (filters.experience === "mid" && /mid|1-3|2-5/.test(experience)) ||
        (filters.experience === "senior" && /senior|3\+|5\+/.test(experience));
      const matchesDistance = filters.distance === "any" || (Number.isFinite(job.distanceKm) && job.distanceKm <= Number(filters.distance));
      return matchesSearch && matchesLocation && matchesCategory && matchesMode && matchesExperience && matchesDistance && matchesDate(job.created_at, filters.datePosted);
    });
  }, [filters, jobs, query]);

  const updateFilter = (field) => (event) => setFilters((current) => ({ ...current, [field]: event.target.value }));

  return (
    <main className="min-h-screen bg-[var(--theme-cream)] text-slate-800">
      <header className="border-b border-[var(--theme-border)] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div><button type="button" onClick={onBack} className="text-sm font-semibold text-[var(--theme-orange)]">← Back</button><h1 className="mt-2 text-3xl font-black text-[var(--theme-navy)]">Active jobs</h1><p className="mt-1 text-sm text-slate-500">Explore every currently published opportunity.</p></div>
          <form onSubmit={(event) => event.preventDefault()} className="flex w-full max-w-xl gap-2 sm:w-auto"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search jobs, skills, companies..." className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--theme-orange)]" /><button type="submit" className="rounded-lg bg-[var(--theme-navy)] px-4 py-2 text-sm font-bold text-white">Search</button></form>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[250px_1fr]">
        <aside className="h-fit rounded-2xl border border-[var(--theme-border)] bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between"><h2 className="font-bold">Filter jobs</h2><button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="text-xs font-bold text-[var(--theme-orange)]">Clear all</button></div>
          <FilterSelect label="Date Posted" value={filters.datePosted} onChange={updateFilter("datePosted")} options={[["all", "Anytime"], ["today", "Past 24 hours"], ["week", "Past week"], ["month", "Past month"]]} />
          <FilterSelect label="Domain / Category" value={filters.category} onChange={updateFilter("category")} options={[["all", "All domains"], ...categories.map((category) => [category, category])]} />
          <FilterSelect label="Distance" value={filters.distance} onChange={updateFilter("distance")} options={[["any", "Any distance"], ["10", "Within 10 km"], ["30", "Within 30 km"], ["100", "Within 100 km"]]} />
          <FilterSelect label="Experience Level" value={filters.experience} onChange={updateFilter("experience")} options={[["all", "All experience levels"], ["fresher", "Fresher / Entry level"], ["mid", "Mid-level"], ["senior", "Senior"]]} />
          <fieldset className="mt-5 space-y-2"><legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Work Mode</legend>{[["all", "All"], ["remote", "Remote"], ["hybrid", "Hybrid"], ["on-site", "On-site"]].map(([value, label]) => <label key={value} className="flex items-center gap-2 text-sm"><input type="radio" name="jobs-work-mode" value={value} checked={filters.workMode === value} onChange={updateFilter("workMode")} />{label}</label>)}</fieldset>
        </aside>
        <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-[var(--theme-navy)]">{filteredJobs.length} active listings</h2></div>{loading && <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">Loading active jobs...</div>}{error && <div role="alert" className="rounded-2xl bg-red-50 p-8 text-center text-sm text-red-700">{error}</div>}{!loading && !error && filteredJobs.length === 0 && <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">No active jobs match these filters.</div>}<div className="space-y-4">{filteredJobs.map((job) => <article key={job.id} className="rounded-2xl border border-[var(--theme-border)] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-lg font-bold text-[var(--theme-navy)]">{job.title}</h3><p className="mt-1 text-sm font-semibold text-slate-600">{job.company}</p><p className="mt-2 text-sm text-slate-500">📍 {job.location}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Actively hiring</span></div><p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{job.description || "No description provided."}</p><div className="mt-4 flex flex-wrap gap-2">{job.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{tag}</span>)}</div></article>)}</div></section>
      </div>
      <MinimalFooter />
    </main>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return <label className="mt-5 block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span><select value={value} onChange={onChange} className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function MinimalFooter() {
  return <footer className="mt-8 bg-[var(--theme-navy)] px-6 py-5 text-xs text-blue-100"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><span>© 2026 MyCareerPath. All rights reserved.</span><nav className="flex gap-3"><a href="#terms">T&amp;C</a><a href="#privacy">Privacy Policy</a><a href="#linkedin">LinkedIn</a><a href="#instagram">Instagram</a></nav></div></footer>;
}
