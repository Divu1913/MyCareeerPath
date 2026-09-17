import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Mail, Phone, Search, X } from "lucide-react";
import { api } from "../../api.js";
import ApplicantModal from "../../components/Recruiter/ApplicantModal.jsx";

const TABS = [["", "All Applications"], ["applied", "New"], ["screening", "Shortlisted"], ["interview", "Interview"], ["hired", "Hired"], ["rejected", "Rejected"]];
const labels = { applied: "New", screening: "Shortlisted", interview: "Interview", hired: "Hired", rejected: "Rejected" };

export default function ApplicationsEmployeeDashboard({ refreshToken, initialFilter }) {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState(initialFilter || "");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => { if (initialFilter !== undefined) setTab(initialFilter); }, [initialFilter]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getApplications({ page: 1, size: 100 }).then((data) => { if (!cancelled) setItems(Array.isArray(data) ? data : data?.items || []); }).catch((err) => { if (!cancelled) setError(err?.message || "Failed to load applications"); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshToken]);
  useEffect(() => { if (!toast) return undefined; const id = setTimeout(() => setToast(""), 4000); return () => clearTimeout(id); }, [toast]);

  const counts = useMemo(() => Object.fromEntries(TABS.map(([key]) => [key, key ? items.filter((item) => item.status === key).length : items.length])), [items]);
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return items.filter((item) => (!tab || item.status === tab) && `${item.candidate_name || ""} ${item.candidate_email || ""} ${item.job_title || ""}`.toLowerCase().includes(search));
  }, [items, tab, query]);

  function exportCsv() {
    const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const header = ["Candidate Name", "Email", "Phone", "Job Title", "Location", "Applied On", "Status"];
    const rows = filtered.map((item) => [item.candidate_name, item.candidate_email, item.candidate_phone, item.job_title, item.candidate_location || "Remote", formatDate(item.created_at), labels[item.status] || item.status]);
    const csv = [header, ...rows].map((row) => row.map(quote).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "applications_export.csv"; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }

  async function updateStage(status, payload = {}) {
    if (!selected) return;
    const id = selected.id || selected._id;
    const name = selected.candidate_name || "Candidate";
    setUpdating(true); setError("");
    try {
      const updated = status === "interview" ? await api.scheduleInterview(id, {
        date: payload.date,
        time: payload.time,
        mode: payload.mode,
        notes: payload.notes,
      }) : await api.updateApplicationStatus(id, status);
      const next = { ...selected, ...updated, ...payload };
      setItems((current) => current.map((item) => (String(item.id || item._id) === String(id) ? next : item)));
      setSelected(null);
      if (status === "interview") setToast("Interview scheduled! Candidate notified on dashboard and via Email/SMS.");
      else if (status === "screening") setToast(`Candidate ${name} has been shortlisted!`);
      else if (status === "hired") setToast(`${name} marked as Hired! Congratulations.`);
      else setToast(`Application for ${name} updated to Rejected.`);
    } catch (err) { setError(err?.message || "Could not update stage"); }
    finally { setUpdating(false); }
  }

  return <main className="applications-page min-h-screen bg-slate-50 text-slate-800">
    {toast && <div role="status" className="fixed left-1/2 top-5 z-[60] flex w-[min(92vw,540px)] -translate-x-1/2 items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold shadow-2xl"><CheckCircle2 className="text-emerald-500" size={24} />{toast}</div>}
    <div className="mx-auto max-w-7xl px-6 py-9">
      <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-black text-[var(--theme-navy)]">Applications</h1><p className="mt-2 text-slate-500">Inspect each candidate profile before moving them through your hiring pipeline.</p></div><div className="flex flex-wrap gap-3"><label className="relative"><Search size={17} className="absolute left-3 top-3 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search candidate or job title..." className="w-72 rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm" /></label><button type="button" onClick={() => { setError(""); setLoading(true); api.getApplications({ page: 1, size: 100 }).then((data) => setItems(Array.isArray(data) ? data : data?.items || [])).catch((err) => setError(err?.message || "Failed to refresh applications")).finally(() => setLoading(false)); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold">🔄 Refresh Data</button><button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold"><Download size={16} />Export</button></div></header>
      <div className="mt-7 grid gap-6 lg:grid-cols-[210px_1fr]"><aside className="rounded-2xl bg-[var(--theme-navy)] p-4 text-white"><p className="px-3 text-xs font-bold uppercase tracking-wide text-blue-200">Pipeline stages</p>{TABS.map(([key, label]) => <button key={key || "all"} type="button" onClick={() => setTab(key)} className={`mt-1 flex w-full justify-between rounded-lg px-3 py-2.5 text-left text-sm font-bold ${tab === key ? "bg-[var(--theme-orange)]" : "text-blue-100"}`}><span>{label}</span><span>{counts[key]}</span></button>)}</aside><section><div className="flex flex-wrap gap-2">{TABS.map(([key, label]) => <button key={key || "all"} type="button" onClick={() => setTab(key)} className={`rounded-xl border px-4 py-2 text-sm font-bold ${tab === key ? "border-orange-200 bg-orange-50 text-[var(--theme-orange)]" : "border-slate-200 bg-white"}`}>{label} ({counts[key]})</button>)}</div>{error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{loading ? <p className="mt-6 rounded-xl bg-white p-8 text-center text-sm text-slate-500">Loading applications...</p> : filtered.length === 0 ? <p className="mt-6 rounded-xl bg-white p-8 text-center text-sm text-slate-500">No applications match this filter.</p> : <div className="mt-5 space-y-3">{filtered.map((item) => <button key={item.id || item._id} type="button" onClick={() => setSelected(item)} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-orange-200 hover:shadow-md"><span><span className="block font-bold text-[var(--theme-navy)]">{item.candidate_name || "Candidate"}</span><span className="mt-1 block text-sm text-slate-500">{item.job_title || "Role"} · {item.candidate_email || "No email"}</span></span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize">{labels[item.status] || item.status}</span></button>)}</div>}</section></div>
    </div>
    {selected && <ApplicantModal app={selected} updating={updating} onClose={() => setSelected(null)} onStage={updateStage} />}
  </main>;
}

function CandidateModal({ app, updating, onClose, onStage }) {
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [interview, setInterview] = useState({ date: "", time: "", mode: "Online Google Meet", notes: "" });
  const updateInterview = (field) => (event) => setInterview((current) => ({ ...current, [field]: event.target.value }));
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"><section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4"><h2 className="text-xl font-bold text-[var(--theme-navy)]">{showInterviewForm ? "Schedule Interview" : "Candidate Profile Summary"}</h2><button type="button" onClick={onClose} aria-label="Close candidate profile"><X /></button></header>{showInterviewForm ? <form onSubmit={(event) => { event.preventDefault(); onStage("interview", interview); }} className="space-y-4 px-6 py-5"><Field label="Interview Date"><input type="date" required value={interview.date} onChange={updateInterview("date")} /></Field><Field label="Interview Time"><input type="time" required value={interview.time} onChange={updateInterview("time")} /></Field><Field label="Interview Mode"><select value={interview.mode} onChange={updateInterview("mode")}><option>Online Google Meet</option><option>In-Person</option><option>Phone Call</option></select></Field><Field label="Notes / Instructions"><textarea rows={3} value={interview.notes} onChange={updateInterview("notes")} placeholder="Meeting links, location details, or interview topic..." /></Field><div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={() => setShowInterviewForm(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Back</button><button type="submit" disabled={updating} className="rounded-lg bg-[var(--theme-orange)] px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{updating ? "Scheduling..." : "Confirm & Schedule"}</button></div></form> : <div className="space-y-6 px-6 py-5"><div><h3 className="text-2xl font-black text-[var(--theme-navy)]">{app.candidate_name || "Candidate"}</h3><p className="text-sm text-slate-500">Applied for {app.job_title || "this role"}</p></div><div className="flex flex-wrap gap-3"><a href={app.candidate_email ? `mailto:${app.candidate_email}` : undefined} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white"><Mail size={16} />Email Candidate</a><a href={app.candidate_phone ? `tel:${app.candidate_phone}` : undefined} className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-700"><Phone size={16} />Call Candidate</a></div><div className="grid gap-4 sm:grid-cols-2"><Detail label="Email" value={app.candidate_email} /><Detail label="Phone" value={app.candidate_phone} /><Detail label="Experience" value={app.candidate_experience_level || app.candidate_headline} /><Detail label="Education" value={app.candidate_education} /></div><div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => onStage("screening")} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold">Shortlist</button><button type="button" onClick={() => setShowInterviewForm(true)} className="rounded-lg bg-[var(--theme-orange)] px-4 py-2 text-xs font-bold text-white">Schedule Interview</button><button type="button" onClick={() => onStage("hired")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Mark Hired</button><button type="button" onClick={() => onStage("rejected")} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Reject</button></div></div>}</section></div>;
}

function Field({ label, children }) { return <label className="block text-sm font-semibold text-slate-700"><span>{label}</span><span className="mt-1 block [&_input]:block [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-300 [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_select]:block [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-300 [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm [&_textarea]:block [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm">{children}</span></label>; }
function Detail({ label, value }) { return <div><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-medium">{value || "Not provided"}</p></div>; }
function formatDate(value) { if (!value) return "-"; const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000); return days <= 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`; }
