// EditSkillsModal - manages candidate skill tags.
// AI-suggested chips (curated static list), free-text input, removable chips.
// Persists to localStorage keyed by userId.
//
// Props: currentSkills[], userId, onSave(skills[]), onClose

import { useState, useEffect, useRef } from "react";
import { api, readProfileById } from "../../api.js";

const FALLBACK_SUGGESTIONS = [
  "JavaScript","TypeScript","React","Node.js","Python","FastAPI","SQL","MongoDB",
  "Docker","Git","REST APIs","AWS","Linux","Data Analysis","Machine Learning",
  "CSS","HTML","GraphQL","Communication","Problem Solving","Team Collaboration",
  "Time Management","Critical Thinking","Project Management","Leadership",
  "Adaptability","Presentation Skills","Customer Service","Figma","UI/UX Design",
  "Adobe XD","Canva","Wireframing","User Research","Prototyping","Visual Design",
  "Excel","Power BI","Tableau","Pandas","NumPy","R","Statistics",
  "Data Visualization","ETL","BigQuery","Agile","Scrum","DevOps","CI/CD",
];

export default function EditSkillsModal({ currentSkills = [], userId, onSave, onClose }) {
  const [skills, setSkills] = useState(() => [...currentSkills]);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState(() => [...FALLBACK_SUGGESTIONS]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function loadSuggestedSkills() {
    setSuggestionsLoading(true);
    try {
      const profile = readProfileById(userId);
      const response = await api.getSuggestedSkills({
        role: profile.role || "candidate",
        education: profile.highest_qualification || profile.highest_education?.degree || profile.education?.slice(-1)[0]?.degree,
        preferred_title: profile.preferred_title || profile.headline,
      });
      const nextSkills = Array.isArray(response?.skills) ? response.skills.filter(Boolean) : [];
      if (nextSkills.length) setSuggestedSkills(nextSkills);
    } catch {
      setSuggestedSkills((current) => current.length ? current : [...FALLBACK_SUGGESTIONS]);
    } finally {
      setSuggestionsLoading(false);
    }
  }

  useEffect(() => {
    loadSuggestedSkills();
    // Suggestions should refresh when a different profile opens this modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const addSkill = (name) => {
    const t = name.trim();
    if (!t) return;
    setSkills((p) => (p.includes(t) ? p : [...p, t]));
    setInput("");
  };
  const removeSkill = (name) => setSkills((p) => p.filter((s) => s !== name));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(input); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (userId) {
        const stored = JSON.parse(localStorage.getItem(`mcp_profile_${userId}`) || "{}");
        localStorage.setItem(`mcp_profile_${userId}`, JSON.stringify({ ...stored, skills }));
      }
      onSave?.(skills);
    } finally { setSaving(false); }
  };

  const available = suggestedSkills.filter((s) => !skills.includes(s));

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Edit skills"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-[var(--theme-border)] flex flex-col max-h-[90vh]"
      >
        <header className="flex items-center justify-between gap-2 border-b border-[var(--theme-border)] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--theme-navy)]">Edit Skills</h2>
            <p className="text-xs text-slate-500 mt-0.5">AI-suggested skills below — click to add</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">✕</button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Current */}
          <section>
            <h3 className="text-sm font-semibold text-[var(--theme-navy)] mb-2">Your skills</h3>
            {skills.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No skills added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-navy)] text-white text-xs font-medium px-3 py-1">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} aria-label={`Remove ${s}`} className="ml-0.5 rounded-full hover:bg-white/20 p-0.5 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Input */}
          <section>
            <label htmlFor="skill-input" className="text-sm font-semibold text-[var(--theme-navy)] block mb-1.5">Add a custom skill</label>
            <div className="flex gap-2">
              <input id="skill-input" ref={inputRef} type="text" value={input}
                onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="e.g. Excel, Agile, Kotlin…"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--theme-orange)]"
              />
              <button type="button" onClick={() => addSkill(input)} disabled={!input.trim()}
                className="rounded-lg bg-[var(--theme-orange)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Add</button>
            </div>
            <p className="mt-1 text-xs text-slate-400">Press Enter or comma to add quickly.</p>
          </section>

          {/* AI suggestions */}
          <section>
            <h3 className="text-sm font-semibold text-[var(--theme-navy)] mb-2 flex items-center gap-1.5">
              <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">AI Suggested</span>
              <span>{suggestionsLoading ? "Loading suggestions…" : "Click to add"}</span>
              <button type="button" onClick={loadSuggestedSkills} disabled={suggestionsLoading} className="ml-auto rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50">✨ Regenerate with AI</button>
            </h3>
            <div className="flex flex-wrap gap-2">
              {available.slice(0, 32).map((s) => (
                <button key={s} type="button" onClick={() => addSkill(s)}
                  className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-cream)] px-3 py-1 text-xs font-medium text-[var(--theme-navy)] hover:bg-[var(--theme-orange)] hover:text-white hover:border-[var(--theme-orange)] transition-colors">
                  + {s}
                </button>
              ))}
            </div>
          </section>
        </div>

        <footer className="flex justify-end gap-3 border-t border-[var(--theme-border)] px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} className="rounded-lg bg-[var(--theme-orange)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Saving…" : "Save skills"}
          </button>
        </footer>
      </div>
    </div>
  );
}
