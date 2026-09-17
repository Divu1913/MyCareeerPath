// AddCertificationModal - add or edit a certification entry.
// Fields: name, issuer, issueDate (month), expiryDate (month, optional),
//         credentialUrl (optional).
// Persists to localStorage keyed by userId.
//
// Props: initial (object|null), userId, existingList[], onSave(list[]), onClose

import { useState, useEffect } from "react";
import MonthYearPicker from "./MonthYearPicker.jsx";
import { api, writeProfileById } from "../../api.js";

const EMPTY = { name:"", issuer:"", expiryDate:"", credentialUrl:"", credential_file_url:"" };

const MONTHS = [
  ["01", "January"], ["02", "February"], ["03", "March"],
  ["04", "April"], ["05", "May"], ["06", "June"],
  ["07", "July"], ["08", "August"], ["09", "September"],
  ["10", "October"], ["11", "November"], ["12", "December"],
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1990 + 1 }, (_, index) => CURRENT_YEAR - index);

function inputCls(err) {
  return `w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${err ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-[var(--theme-orange)]"}`;
}
function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}

export default function AddCertificationModal({ initial=null, userId, existingList=[], onSave, onClose }) {
  // Extract date components from the initial data if present
  const initialYear = initial?.issueDate?.split("-")[0] || initial?.issueYear || "";
  const initialMonth = initial?.issueDate?.split("-")[1] || initial?.issueMonth || "";

  // 1. State Initialization cleanly at the top
  const [issueMonth, setIssueMonth] = useState(initialMonth);
  const [issueYear, setIssueYear] = useState(initialYear);

  const [form, setForm] = useState(() => {
    if (!initial) return { ...EMPTY };
    return { ...EMPTY, ...initial };
  });
  
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Certification name is required.";
    if (!form.issuer.trim()) errs.issuer = "Issuing organisation is required.";
    if (!issueMonth || !issueYear) errs.issueDate = "Issue month and year are required.";
    if (!form.credentialUrl?.trim() && !form.credential_file_url)
      errs.credentialUrl = "Upload a certificate file or provide a Credential URL/ID.";
    if (form.credentialUrl?.trim() && form.credentialUrl.trim().includes(" "))
      errs.credentialUrl = "Must be a valid URL or credential ID.";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const entry = { id: initial?.id || Date.now().toString(), ...form, issueDate: `${issueYear}-${issueMonth}`, name: form.name.trim(), issuer: form.issuer.trim(), credentialUrl: form.credentialUrl.trim() };
      const updated = initial ? existingList.map((c) => (c.id === initial.id ? entry : c)) : [...existingList, entry];
      if (userId) writeProfileById(userId, { certifications: updated });
      onSave?.(updated);
    } finally { setSaving(false); }
  };

  async function uploadCertificate(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrors((current) => ({ ...current, credentialUrl: "File size exceeds 10MB limit. Please choose a smaller certificate." }));
      return;
    }
    try {
      const result = await api.uploadCertificate(file);
      set("credential_file_url", result.certificate_file_url);
    } catch (error) {
      setErrors((current) => ({ ...current, credentialUrl: error?.message || "Could not upload certificate." }));
    }
  }

  const isEdit = Boolean(initial);

  return (
    <div role="dialog" aria-modal="true" aria-label={isEdit ? "Edit certification" : "Add certification"}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-[var(--theme-border)] flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between border-b border-[var(--theme-border)] px-6 py-4">
          <h2 className="text-lg font-bold text-[var(--theme-navy)]">{isEdit ? "Edit Certification" : "Add Certification"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">✕</button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Certification name *" error={errors.name}>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. AWS Certified Developer" className={inputCls(errors.name)} />
          </Field>
          <Field label="Issuing organisation *" error={errors.issuer}>
            <input type="text" value={form.issuer} onChange={(e) => set("issuer", e.target.value)} placeholder="e.g. Amazon Web Services" className={inputCls(errors.issuer)} />
          </Field>
          
          <div className="grid grid-cols-2 gap-4">
            {/* 2. Controlled Input Binding: Bind to Month/Year inline selects directly */}
            <Field label="Issue date *" error={errors.issueDate}>
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={issueMonth} 
                  onChange={(e) => {
                    setIssueMonth(e.target.value);
                    setErrors((p) => ({ ...p, issueDate: undefined }));
                  }} 
                  className={inputCls(errors.issueDate)}
                >
                  <option value="">Month</option>
                  {MONTHS.map(([number, label]) => <option key={number} value={number}>{label}</option>)}
                </select>
                
                <select 
                  value={issueYear} 
                  onChange={(e) => {
                    setIssueYear(e.target.value);
                    setErrors((p) => ({ ...p, issueDate: undefined }));
                  }} 
                  className={inputCls(errors.issueDate)}
                >
                  <option value="">Year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </Field>

            <Field label="Expiry date (optional)">
              <MonthYearPicker value={form.expiryDate} onChange={(value) => set("expiryDate", value)} className={inputCls()} />
            </Field>
          </div>
          <Field label="Credential proof (file or URL / ID) *" error={errors.credentialUrl}>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={uploadCertificate} className={inputCls(errors.credentialUrl)} />
            {form.credential_file_url && <p className="mt-1 text-xs text-emerald-700">Certificate file uploaded.</p>}
            <input type="text" value={form.credentialUrl} onChange={(e) => set("credentialUrl", e.target.value)} placeholder="Or enter a Credential URL / ID" className={`${inputCls(errors.credentialUrl)} mt-2`} />
          </Field>
        </div>

        <footer className="flex justify-end gap-3 border-t border-[var(--theme-border)] px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} className="rounded-lg bg-[var(--theme-orange)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Saving…" : isEdit ? "Update" : "Add certification"}
          </button>
        </footer>
      </div>
    </div>
  );
}
