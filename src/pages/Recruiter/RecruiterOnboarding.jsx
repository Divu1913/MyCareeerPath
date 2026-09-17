import { useState } from "react";
import { api, formatAccountError } from "../../api.js";

export default function RecruiterOnboarding({ user, onComplete, onLogout }) {
  const userId = user?.id || user?._id;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    company_name: user?.company_name || "",
    company_website: user?.company_website || "",
    company_address: user?.company_address || "",
    company_tax_id: user?.company_tax_id || "",
    full_name: user?.full_name || "",
    headline: user?.headline || user?.job_title || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };
  const isCompanyStepComplete = [
    form.company_name,
    form.company_website,
    form.company_address,
    form.company_tax_id,
  ].every((value) => value.trim());
  const isContactStepComplete = [
    form.full_name,
    form.headline,
    form.email,
    form.phone,
  ].every((value) => value.trim());

  async function submit(event) {
    event.preventDefault();
    if (!userId || !isContactStepComplete) return;

    setSaving(true);
    setError("");
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim()])
      );
      const updatedUser = await api.updateProfile(userId, payload);
      onComplete?.(updatedUser);
    } catch (err) {
      setError(formatAccountError(err, "Could not save recruiter information."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--theme-cream)]">
      <header className="sticky top-0 z-40 border-b border-[var(--theme-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5 text-[var(--theme-navy)]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--theme-navy)] text-sm font-black text-white">M</span>
            <span className="text-lg font-bold tracking-tight">MyCareerPath</span>
          </div>
          <button type="button" onClick={onLogout} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-4xl items-center px-4 py-8 sm:px-6">
        <form onSubmit={submit} className="w-full overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--theme-border)] bg-slate-50 px-6 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--theme-orange)]">Recruiter onboarding</p>
              <h1 className="mt-1 text-xl font-bold text-[var(--theme-navy)]">Complete your recruiter profile</h1>
            </div>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">Step {step} of 2</span>
          </div>

          <div className="p-6 sm:p-8">
            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Company details</h2>
                  <p className="mt-1 text-sm text-slate-500">These verification details will accompany your job postings.</p>
                </div>
                <Field label="Company name"><input required value={form.company_name} onChange={update("company_name")} placeholder="Registered company name" /></Field>
                <Field label="Website"><input required type="url" value={form.company_website} onChange={update("company_website")} placeholder="https://company.example" /></Field>
                <Field label="Address"><textarea required rows={3} value={form.company_address} onChange={update("company_address")} placeholder="Registered business address" /></Field>
                <Field label="Tax ID / Registration number"><input required value={form.company_tax_id} onChange={update("company_tax_id")} placeholder="GSTIN or registration number" /></Field>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Recruiter contact information</h2>
                  <p className="mt-1 text-sm text-slate-500">Give candidates a clear point of contact for your organization.</p>
                </div>
                <Field label="Full name"><input required value={form.full_name} onChange={update("full_name")} placeholder="Your full name" /></Field>
                <Field label="Job title / designation"><input required value={form.headline} onChange={update("headline")} placeholder="e.g. Talent Acquisition Manager" /></Field>
                <Field label="Email"><input required type="email" value={form.email} onChange={update("email")} placeholder="you@company.com" /></Field>
                <Field label="Phone"><input required type="tel" value={form.phone} onChange={update("phone")} placeholder="10-digit mobile number" /></Field>
              </div>
            )}

            {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              {step === 2 ? <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back</button> : <span />}
              {step === 1 ? (
                <button type="button" onClick={() => setStep(2)} disabled={!isCompanyStepComplete} className="rounded-lg bg-[var(--theme-orange)] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50">Continue</button>
              ) : (
                <button type="submit" disabled={saving || !isContactStepComplete} className="rounded-lg bg-[var(--theme-orange)] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving..." : "Finish onboarding"}</button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
      {children && <span className="block [&_input]:block [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-300 [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:outline-none [&_input:focus]:border-[var(--theme-orange)] [&_textarea]:block [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm [&_textarea]:outline-none [&_textarea:focus]:border-[var(--theme-orange)]">{children}</span>}
    </label>
  );
}
