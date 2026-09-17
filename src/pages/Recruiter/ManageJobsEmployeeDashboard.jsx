import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  FilePenLine,
  MoreVertical,
  Pause,
  Play,
  Search,
  XCircle,
} from "lucide-react";
import { api } from "../../api.js";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function ManageJobsEmployeeDashboard({
  refreshToken,
  onNavigate,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [modal, setModal] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.getItems({ page: 1, size: 100 });
        if (!cancelled) setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load jobs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);
  async function toggle(item) {
    const id = item.id || item._id;
    setActionId(id);
    try {
      const updated = await api.updateItem(id, {
        is_published: !item.is_published,
      });
      setItems((current) =>
        current.map((entry) =>
          (entry.id || entry._id) === id ? updated : entry,
        ),
      );
    } catch (err) {
      setError(err?.message || "Could not update job");
    } finally {
      setActionId(null);
    }
  }
  async function remove(item) {
    const id = item.id || item._id;
    if (!window.confirm(`Delete ${item.title || "this job"}? This cannot be undone.`)) return;
    setActionId(id);
    try {
      await api.deleteItem(id);
      setItems((current) => current.filter((entry) => String(entry.id || entry._id) !== String(id)));
      setModal(null);
    } catch (err) { setError(err?.message || "Could not delete job"); }
    finally { setActionId(null); }
  }
  async function saveEdit(event) {
    event.preventDefault();
    const item = modal.item;
    const form = new FormData(event.currentTarget);
    const id = item.id || item._id;
    setActionId(id);
    const payload = {
      title: form.get("title"),
      description: form.get("description"),
      tags: String(form.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean),
      company_name: form.get("company_name"),
    };
    try {
      const updated = await api.updateItem(id, payload);
      setItems((current) => current.map((entry) => String(entry.id || entry._id) === String(id) ? updated : entry));
      setModal(null);
    } catch (err) { setError(err?.message || "Could not edit job"); }
    finally { setActionId(null); }
  }
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const text =
          `${item.title || ""} ${item.company_name || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
        return (
          text.includes(query.toLowerCase()) &&
          (status === "all" ||
            (status === "active" ? item.is_published : !item.is_published)) &&
          (type === "all" || type === "full-time")
        );
      }),
    [items, query, status, type],
  );
  const stats = [
    {
      label: "Total Jobs",
      value: items.length,
      icon: BriefcaseBusiness,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Active Jobs",
      value: items.filter((item) => item.is_published).length,
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Closed Jobs",
      value: items.filter((item) => !item.is_published).length,
      icon: XCircle,
      tone: "bg-orange-50 text-orange-700",
    },
    {
      label: "Draft Jobs",
      value: 0,
      icon: FilePenLine,
      tone: "bg-violet-50 text-violet-700",
    },
  ];
  return (
    <main className="manage-page min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-7xl px-6 py-9">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[var(--theme-navy)]">
              Manage Jobs
            </h1>
            <p className="mt-2 text-slate-500">
              View, edit and manage all your posted jobs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.("post-job")}
            className="rounded-lg bg-[var(--theme-orange)] px-5 py-2.5 text-sm font-bold text-white shadow-sm"
          >
            + Post New Job
          </button>
        </header>
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <article
              key={label}
              className="relative overflow-hidden rounded-2xl border border-amber-100 bg-[#fffdf7] p-5 shadow-sm"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
              >
                <Icon size={20} />
              </div>
              <p className="mt-4 font-bold text-slate-700">{label}</p>
              <p className="mt-1 text-3xl font-black text-[var(--theme-navy)]">
                {value}
              </p>
              <div className="absolute bottom-0 left-0 h-2 w-full bg-gradient-to-r from-transparent via-orange-100 to-orange-300" />
            </article>
          ))}
        </section>
        <div className="mt-6 flex flex-wrap gap-3">
          <label className="relative min-w-[220px] flex-1">
            <Search
              size={17}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by job title, company or skills..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--theme-orange)]"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="all">All Job Type</option>
            <option value="full-time">Full Time</option>
          </select>
        </div>
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {loading ? (
          <p className="mt-6 rounded-2xl bg-white p-6 text-sm text-slate-500">
            Loading your jobs...
          </p>
        ) : (
          <section className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Job Title</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Applicants</th>
                  <th className="px-5 py-4">Job Type</th>
                  <th className="px-5 py-4">Posted On</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const id = item.id || item._id;
                  return (
                    <tr key={id} className="border-t border-slate-100">
                      <td className="px-5 py-4">
                        <p className="font-bold text-[var(--theme-navy)]">
                          {item.title || "Untitled job"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.company_name || "Company not provided"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {item.location || item.company_address || "Remote"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                          {item.application_count || 0}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                          Full Time
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => toggle(item)}
                          disabled={actionId === id}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${item.is_published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                        >
                          {item.is_published ? (
                            <Play size={12} />
                          ) : (
                            <Pause size={12} />
                          )}
                          {item.is_published ? "Active" : "Paused"}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setModal({ type: "view", item })}
                            className="rounded-lg border border-slate-200 p-2 text-blue-600"
                            title="View"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setModal({ type: "edit", item })}
                            className="rounded-lg border border-slate-200 p-2 text-violet-600"
                            title="Edit"
                          >
                            <FilePenLine size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(item)}
                            disabled={actionId === id}
                            className="rounded-lg border border-slate-200 p-2"
                            title="More actions"
                          >
                            <XCircle size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="p-8 text-center text-sm text-slate-500">
                No jobs match these filters.
              </p>
            )}
          </section>
        )}
      </div>
      {modal && <JobModal modal={modal} onClose={() => setModal(null)} onSubmit={saveEdit} onDelete={remove} saving={Boolean(actionId)} />}
    </main>
  );
}

function JobModal({ modal, onClose, onSubmit, onDelete, saving }) {
  const item = modal.item;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><section className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><header className="flex items-center justify-between"><h2 className="text-xl font-black text-[var(--theme-navy)]">{modal.type === "view" ? "Job Details" : "Edit Job"}</h2><button type="button" onClick={onClose} aria-label="Close"><XCircle /></button></header>{modal.type === "view" ? <div className="mt-5 space-y-3"><h3 className="text-2xl font-bold">{item.title || "Untitled job"}</h3><p className="text-sm text-slate-500">{item.company_name || "Company not provided"}</p><p className="whitespace-pre-line text-sm text-slate-700">{item.description || "No description provided."}</p><p className="text-sm"><strong>Skills:</strong> {(item.tags || []).join(", ") || "None listed"}</p><button type="button" onClick={() => onDelete(item)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">Delete Job</button></div> : <form onSubmit={onSubmit} className="mt-5 space-y-4"><input name="title" required defaultValue={item.title || ""} placeholder="Job title" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><input name="company_name" defaultValue={item.company_name || ""} placeholder="Company name" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><textarea name="description" rows={6} defaultValue={item.description || ""} placeholder="Job description" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><input name="tags" defaultValue={(item.tags || []).join(", ")} placeholder="Skills, comma separated" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-semibold">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-[var(--theme-orange)] px-4 py-2 text-sm font-bold text-white">{saving ? "Saving..." : "Save changes"}</button></div></form>}</section></div>;
}
