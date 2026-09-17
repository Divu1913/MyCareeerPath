// EducationPreferencesModal - add or edit an education entry.
// Fields: degree, field, institution, startYear, endYear (or current), grade/GPA.
// Persists to localStorage keyed by userId.
//
// Props: initial (object|null), userId, existingList[], onSave(list[]), onClose

import { useState, useEffect } from "react";
import { YEARS } from "./MonthYearPicker.jsx";
import { EDUCATION_CATEGORY_OPTIONS, getEducationOptions } from "../../constants/educationData.js";

const EMPTY = { degree:"", qualificationCategory:"", educationBranch:"", otherQualification:"", field:"", institution:"", startYear:"", endYear:"", grade:"", current:false };

function initialEducationForm(initial) {
  if (!initial) return { ...EMPTY };
  const category = initial.qualificationCategory || initial.degree || "";
  const knownCategory = EDUCATION_CATEGORY_OPTIONS.find((option) => category === option || category.startsWith(`${option} -`)) || "";
  const branch = initial.educationBranch || (knownCategory && category.includes(" - ") ? category.slice(category.indexOf(" - ") + 3) : "");
  return { ...EMPTY, ...initial, qualificationCategory: knownCategory, educationBranch: branch };
}

function inputCls(err) {
  return `w-full rounded-lg border px-3 py-2 text-sm outline-none transition bg-white ${err ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-[var(--theme-orange)]"}`;
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

export default function EducationPreferencesModal({ initial=null, userId, existingList=[], onSave, onClose }) {
  const [form, setForm] = useState(() => initialEducationForm(initial));
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

  const secondaryOptions = getEducationOptions(form.qualificationCategory);
  const showOtherQualification = form.qualificationCategory === "Other" || form.educationBranch === "Other";

  const validate = () => {
    const errs = {};
    if (!form.qualificationCategory) errs.qualificationCategory = "Please select a qualification.";
    if (secondaryOptions.length && !form.educationBranch) errs.educationBranch = "Please select a stream or specialization.";
    if (showOtherQualification && !form.otherQualification.trim()) errs.otherQualification = "Please specify your qualification.";
    if (!form.institution.trim()) errs.institution = "Institution name is required.";
    if (!form.startYear) errs.startYear = "Start year is required.";
    if (!form.current && !form.endYear) errs.endYear = "End year is required (or mark as current).";
    if (form.startYear && form.endYear && Number(form.endYear) < Number(form.startYear))
      errs.endYear = "End year cannot be before start year.";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const entry = {
        id: initial?.id || Date.now().toString(),
        ...form,
        degree: showOtherQualification ? form.otherQualification.trim() : (form.educationBranch ? `${form.qualificationCategory} - ${form.educationBranch}` : form.qualificationCategory),
        institution: form.institution.trim(),
        field: form.field.trim(),
        grade: form.grade.trim(),
        endYear: form.current ? "Present" : form.endYear,
      };
      const updated = initial ? existingList.map((e) => (e.id === initial.id ? entry : e)) : [...existingList, entry];
      if (userId) {
        const stored = JSON.parse(localStorage.getItem(`mcp_profile_${userId}`) || "{}");
        localStorage.setItem(`mcp_profile_${userId}`, JSON.stringify({ ...stored, education: updated }));
      }
      onSave?.(updated);
    } finally { setSaving(false); }
  };

  const isEdit = Boolean(initial);

  return (
    <div role="dialog" aria-modal="true" aria-label={isEdit ? "Edit education" : "Add education"}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-[var(--theme-border)] flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between border-b border-[var(--theme-border)] px-6 py-4">
          <h2 className="text-lg font-bold text-[var(--theme-navy)]">{isEdit ? "Edit Education" : "Add Education"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">✕</button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Highest qualification *" error={errors.qualificationCategory}>
            <select id="education-category" name="qualificationCategory" value={form.qualificationCategory} onChange={(e) => setForm((current) => ({ ...current, qualificationCategory: e.target.value, educationBranch: "", otherQualification: "" }))} className={inputCls(errors.qualificationCategory)}>
              <option value="">Select qualification</option>
              {EDUCATION_CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </Field>
          {secondaryOptions.length > 0 && <Field label="Stream / specialization *" error={errors.educationBranch}>
            <select id="education-branch" name="educationBranch" value={form.educationBranch} onChange={(e) => set("educationBranch", e.target.value)} className={inputCls(errors.educationBranch)}>
              <option value="">Select stream or specialization</option>
              {secondaryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </Field>}
          {showOtherQualification && <Field label="Please specify your qualification / degree *" error={errors.otherQualification}>
            <input id="other-qualification" name="otherQualification" value={form.otherQualification} onChange={(e) => set("otherQualification", e.target.value)} placeholder="Please specify your qualification/degree" className={inputCls(errors.otherQualification)} />
          </Field>}
          <Field label="Field of study">
            <input type="text" value={form.field} onChange={(e) => set("field", e.target.value)} placeholder="e.g. Computer Science, Business Administration" className={inputCls()} />
          </Field>
          <Field label="Institution *" error={errors.institution}>
            <input type="text" value={form.institution} onChange={(e) => set("institution", e.target.value)} placeholder="e.g. SGBAU Amravati" className={inputCls(errors.institution)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start year *" error={errors.startYear}>
              <select value={form.startYear} onChange={(e) => set("startYear", e.target.value)} className={inputCls(errors.startYear)}>
                <option value="">Select year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
            <Field label="End year *" error={errors.endYear}>
              <select value={form.current ? "" : form.endYear} onChange={(e) => set("endYear", e.target.value)} disabled={form.current} className={inputCls(errors.endYear)}>
                <option value="">Select year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
            <input type="checkbox" checked={form.current}
              onChange={(e) => { set("current", e.target.checked); if (e.target.checked) set("endYear", ""); }}
              className="h-4 w-4 rounded border-slate-300 accent-[var(--theme-orange)]" />
            I am currently studying here
          </label>
          <Field label="Grade / GPA (optional)">
            <input type="text" value={form.grade} onChange={(e) => set("grade", e.target.value)} placeholder="e.g. 8.5 CGPA, First Class, 3.8/4.0" className={inputCls()} />
          </Field>
        </div>

        <footer className="flex justify-end gap-3 border-t border-[var(--theme-border)] px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} className="rounded-lg bg-[var(--theme-orange)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Saving…" : isEdit ? "Update" : "Add education"}
          </button>
        </footer>
      </div>
    </div>
  );
}
