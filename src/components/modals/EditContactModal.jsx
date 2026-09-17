import { useEffect, useState } from "react";
import { LOCATION_HIERARCHY, LOCATION_STATES } from "../../utils/locations.js";

const EMPTY = { email: "", phone: "", state: "", district: "", city: "", local_address: "", linkedin_url: "", github_url: "", leetcode_url: "", website: "", headline: "" };
const validUrl = (value) => !value || /^https?:\/\/.+/i.test(value);

export default function EditContactModal({ user, profile = {}, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    email: user?.email || "",
    phone: user?.phone || "",
    state: user?.state || "",
    district: user?.district || "",
    city: user?.location || "",
    local_address: user?.local_address || "",
    linkedin_url: user?.linkedin_url || user?.linkedin || "",
    github_url: user?.github_url || "",
    leetcode_url: user?.leetcode_url || "",
    website: user?.website || "",
    headline: user?.headline || "",
    ...profile,
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };
  const districts = form.state ? Object.keys(LOCATION_HIERARCHY[form.state] || {}) : [];
  const cities = form.state && form.district ? LOCATION_HIERARCHY[form.state]?.[form.district] || [] : [];

  async function submit(event) {
    event.preventDefault();
    setError("");

    // Validate email
    const emailVal = form.email.trim();
    if (emailVal && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailVal)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate phone: remove non-digits
    const phoneVal = form.phone.trim();
    if (phoneVal) {
      let digits = phoneVal.replace(/\D/g, "");
      if (digits.length === 12 && digits.startsWith("91")) {
        digits = digits.slice(2);
      } else if (digits.length === 11 && digits.startsWith("0")) {
        digits = digits.slice(1);
      }
      
      if (!/^[6-9]\d{9}$/.test(digits)) {
        setError("Please enter a valid 10-digit Indian mobile number (starting with 6-9).");
        return;
      }
    }

    // Validate URLs
    if (![form.linkedin_url, form.github_url, form.leetcode_url, form.website].every((value) => validUrl(value.trim()))) {
      setError("Social and portfolio URLs must start with http:// or https://.");
      return;
    }

    setSaving(true);
    try {
      await onSave?.({
        email: emailVal,
        phone: form.phone.trim(), // We let backend clean/validate it again
        location: form.city.trim(),
        state: form.state,
        district: form.district,
        local_address: form.local_address.trim(),
        linkedin: form.linkedin_url.trim(),
        linkedin_url: form.linkedin_url.trim(),
        github_url: form.github_url.trim(),
        leetcode_url: form.leetcode_url.trim(),
        website: form.website.trim(),
        headline: form.headline.trim(),
      });
    } catch (err) {
      setError(err?.message || "Could not update contact details.");
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit contact information"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    >
      <form
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-[var(--theme-border)]"
      >
        <header className="flex items-center justify-between border-b border-[var(--theme-border)] px-6 py-4">
          <h2 className="text-lg font-bold text-[var(--theme-navy)]">Edit Contact Information</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </header>

        <div className="space-y-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
          <ContactField label="Professional headline">
            <input
              id="professional-headline"
              name="headline"
              autoComplete="organization-title"
              value={form.headline}
              onChange={set("headline")}
              maxLength={160}
              placeholder="e.g. Frontend developer"
              className={inputCls}
            />
          </ContactField>

          <ContactField label="Email Address">
            <input
              id="profile-email"
              name="email"
              autoComplete="email"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="you@example.com"
              className={inputCls}
            />
          </ContactField>

          <ContactField label="Mobile Phone">
            <input
              id="profile-phone"
              name="phone"
              autoComplete="tel"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="e.g. 9876543210"
              className={inputCls}
            />
          </ContactField>

          <div className="grid gap-4 sm:grid-cols-2">
            <ContactField label="State"><select id="profile-state" name="state" autoComplete="address-level1" value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value, district: "", city: "" }))} className={inputCls}><option value="">Select state</option>{LOCATION_STATES.map((state) => <option key={state} value={state}>{state}</option>)}</select></ContactField>
            <ContactField label="District"><select id="profile-district" name="district" autoComplete="address-level2" value={form.district} onChange={(event) => setForm((current) => ({ ...current, district: event.target.value, city: "" }))} disabled={!form.state} className={inputCls}><option value="">Select district</option>{districts.map((district) => <option key={district} value={district}>{district}</option>)}</select></ContactField>
          </div>

          <ContactField label="City"><select id="profile-city" name="city" autoComplete="address-level3" value={form.city} onChange={set("city")} disabled={!form.district} className={inputCls}><option value="">Select city</option>{cities.map((city) => <option key={city} value={city}>{city}</option>)}</select></ContactField>

          <ContactField label="Local address"><textarea id="profile-address" name="local_address" autoComplete="street-address" value={form.local_address} onChange={set("local_address")} maxLength={300} rows={2} placeholder="House, street, or area" className={inputCls} /></ContactField>

          <ContactField label="LinkedIn URL">
            <input
              id="profile-linkedin"
              name="linkedin_url"
              autoComplete="url"
              type="url"
              value={form.linkedin_url}
              onChange={set("linkedin_url")}
              placeholder="https://linkedin.com/in/your-name"
              className={inputCls}
            />
          </ContactField>

          <ContactField label="GitHub URL"><input id="profile-github" name="github_url" autoComplete="url" type="url" value={form.github_url} onChange={set("github_url")} placeholder="https://github.com/your-name" className={inputCls} /></ContactField>
          <ContactField label="LeetCode URL"><input id="profile-leetcode" name="leetcode_url" autoComplete="url" type="url" value={form.leetcode_url} onChange={set("leetcode_url")} placeholder="https://leetcode.com/your-name" className={inputCls} /></ContactField>

          <ContactField label="Portfolio URL">
            <input
              id="profile-website"
              name="website"
              autoComplete="url"
              type="url"
              value={form.website}
              onChange={set("website")}
              placeholder="https://yourportfolio.com"
              className={inputCls}
            />
          </ContactField>

          {error && <p role="alert" className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg">{error}</p>}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--theme-border)] px-6 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="rounded-lg bg-[var(--theme-orange)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

const inputCls = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--theme-orange)]";
function ContactField({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
