import { useEffect, useState } from "react";
import MonthYearPicker from "./MonthYearPicker.jsx";
import { writeProfileById } from "../../api.js";

const EMPTY = { title: "", company: "", startDate: "", endDate: "", current: false, description: "" };
const inputCls = (error) => `w-full rounded-lg border px-3 py-2 text-sm outline-none transition bg-white ${error ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-[var(--theme-orange)]"}`;

export default function AddExperienceModal({ initial = null, existingList = [], userId, onSave, onClose }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(initial || {}) }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: undefined })); };

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function save() {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Job title is required.";
    if (!form.company.trim()) nextErrors.company = "Company is required.";
    if (!form.startDate) nextErrors.startDate = "Start date is required.";
    if (!form.current && !form.endDate) nextErrors.endDate = "End date required, or mark as current.";
    if (form.startDate && form.endDate && form.endDate < form.startDate) nextErrors.endDate = "End date cannot be before start date.";
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);
    setSaving(true);
    try {
      const entry = { id: initial?.id || Date.now().toString(), ...form, title: form.title.trim(), company: form.company.trim(), description: form.description.trim(), endDate: form.current ? "" : form.endDate };
      const updated = initial ? existingList.map((item) => item.id === initial.id ? entry : item) : [...existingList, entry];
      if (userId) writeProfileById(userId, { experience: updated });
      onSave?.(updated);
    } finally { setSaving(false); }
  }

  return <div role="dialog" aria-modal="true" aria-label={initial ? "Edit experience" : "Add experience"} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div onMouseDown={(e) => e.stopPropagation()} className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-[var(--theme-border)]">
      <header className="flex items-center justify-between border-b border-[var(--theme-border)] px-6 py-4"><h2 className="text-lg font-bold text-[var(--theme-navy)]">{initial ? "Edit Experience" : "Add Experience"}</h2><button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">✕</button></header>
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <Field label="Job title *" error={errors.title}><input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls(errors.title)} /></Field>
        <Field label="Company *" error={errors.company}><input value={form.company} onChange={(e) => set("company", e.target.value)} className={inputCls(errors.company)} /></Field>
        <div className="grid grid-cols-2 gap-4"><Field label="Start date *" error={errors.startDate}><MonthYearPicker value={form.startDate} onChange={(value) => set("startDate", value)} className={inputCls(errors.startDate)} /></Field><Field label="End date *" error={errors.endDate}><MonthYearPicker value={form.current ? "" : form.endDate} disabled={form.current} onChange={(value) => set("endDate", value)} className={inputCls(errors.endDate)} /></Field></div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.current} onChange={(e) => set("current", e.target.checked)} className="h-4 w-4 accent-[var(--theme-orange)]" />I currently work here</label>
        <Field label="Description (optional)"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={inputCls()} /></Field>
      </div>
      <footer className="flex justify-end gap-3 border-t border-[var(--theme-border)] px-6 py-4"><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button type="button" onClick={save} disabled={saving} className="rounded-lg bg-[var(--theme-orange)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : initial ? "Update" : "Add experience"}</button></footer>
    </div>
  </div>;
}

function Field({ label, error, children }) { return <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>{children}{error && <p className="mt-1 text-xs text-red-600">{error}</p>}</label>; }
