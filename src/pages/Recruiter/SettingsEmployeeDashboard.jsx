import { useEffect, useState } from "react";
import { api, formatAccountError } from "../../api.js";
import DangerZone from "../../components/DangerZone.jsx";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const DEFAULT_NOTIFICATION_PREFERENCES = { email_notifications: true, application_updates: true, sms_alerts: true };

function getInitials(user) {
  const value = user?.full_name || user?.email || user?.phone || "R";
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "R";
}

export default function SettingsEmployeeDashboard({ user, onUpdateUser, onDeleteAccount, initialSection = "profile" }) {
  const [profile, setProfile] = useState(user);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ avatar_url: user?.avatar_url || "" });
  const [section, setSection] = useState(initialSection);
  const [notificationPreferences, setNotificationPreferences] = useState({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...(user?.notification_preferences || {}) });
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => setProfile(user), [user]);
  useEffect(() => setNotificationPreferences({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...(user?.notification_preferences || {}) }), [user]);
  useEffect(() => setSection(initialSection), [initialSection]);

  const avatarSource = profile?.avatar_url || form.avatar_url || "";
  const valueOrPending = (value) => value || "Not provided";

  const syncAvatar = (nextSource) => {
    const nextUser = { ...(profile || user || {}), avatar_url: nextSource };
    setProfile(nextUser);
    setForm((current) => ({ ...current, avatar_url: nextSource }));
    onUpdateUser?.(nextUser);
  };

  const beginEditing = () => {
    setError("");
    setForm({
      avatar_url: profile?.avatar_url || "",
      company_name: profile?.company_name || "",
      company_website: profile?.company_website || "",
      company_address: profile?.company_address || "",
      company_tax_id: profile?.company_tax_id || "",
      headline: profile?.headline || profile?.job_title || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
    });
    setEditing(true);
  };

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleAvatarSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a JPG or PNG image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError("Profile photo must be under 2MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const source = String(reader.result || "");
      syncAvatar(source);
      setError("");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  async function save(event) {
    event.preventDefault();
    const userId = profile?.id || profile?._id;
    if (!userId) return;

    setSaving(true);
    setError("");
    try {
      const payload = Object.fromEntries(
        Object.entries(form)
          .filter(([, value]) => value !== undefined && value !== null && value !== "")
          .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
      );
      const updatedUser = await api.updateProfile(userId, payload);
      const merged = { ...(updatedUser || profile || user || {}), ...payload };
      setProfile(merged);
      onUpdateUser?.(merged);
      setEditing(false);
    } catch (err) {
      setError(formatAccountError(err, "Could not update recruiter information."));
    } finally {
      setSaving(false);
    }
  }

  async function saveNotificationPreferences() {
    setNotificationSaving(true); setError(""); setNotificationMessage("");
    try {
      const updated = await api.updateNotificationPreferences(notificationPreferences);
      const merged = { ...(profile || user || {}), ...(updated || {}), notification_preferences: notificationPreferences };
      setProfile(merged); onUpdateUser?.(merged); setNotificationMessage("Notification preferences saved.");
    } catch (err) { setError(formatAccountError(err, "Could not save notification preferences.")); }
    finally { setNotificationSaving(false); }
  }

  return (
    <main className="settings-page min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--theme-orange)]">Recruiter · Settings</p>
            <h1 className="mt-1 text-3xl font-bold text-[var(--theme-navy)]">Recruiter settings</h1>
            <p className="mt-2 text-slate-600">Manage your company verification and recruiter contact information.</p>
          </div>
          {!editing && <button type="button" onClick={beginEditing} className="rounded-lg bg-[var(--theme-orange)] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-95">Edit information</button>}
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-2xl border border-[var(--theme-border)] bg-white p-3 shadow-sm">
            {[['profile', 'My Profile'], ['company', 'Company Profile'], ['security', 'Account & Security'], ['notifications', 'Notification Preferences']].map(([key, label]) => <button key={key} type="button" onClick={() => setSection(key)} className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold ${section === key ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>{label}<span>›</span></button>)}
          </aside>
          <div>
        {section === "profile" && (editing ? (
          <form onSubmit={save} className="mt-8 rounded-2xl border border-[var(--theme-border)] bg-white p-6 shadow-sm">
            <div className="mb-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-full bg-[var(--theme-navy)] text-4xl font-bold text-white shadow-sm ring-4 ring-white">
                {avatarSource ? <img src={avatarSource} alt="Profile" className="h-full w-full object-cover" /> : getInitials(profile || user)}
              </div>
              <label htmlFor="recruiter-avatar-upload" className="cursor-pointer rounded-lg bg-[var(--theme-orange)] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-95">Upload Photo</label>
              <input id="recruiter-avatar-upload" type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleAvatarSelect} />
              <p className="text-xs text-slate-400">JPG, PNG, Max 2MB</p>
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
              <EditSection title="Company information">
                <Field label="Company name"><input required value={form.company_name} onChange={update("company_name")} /></Field>
                <Field label="Website"><input required type="url" value={form.company_website} onChange={update("company_website")} /></Field>
                <Field label="Address"><textarea required rows={3} value={form.company_address} onChange={update("company_address")} /></Field>
                <Field label="Tax ID / Registration number"><input required value={form.company_tax_id} onChange={update("company_tax_id")} /></Field>
              </EditSection>
              <EditSection title="Recruiter contact information">
                <Field label="Job title / designation"><input required value={form.headline} onChange={update("headline")} /></Field>
                <Field label="Email"><input required type="email" value={form.email} onChange={update("email")} /></Field>
                <Field label="Phone"><input required type="tel" value={form.phone} onChange={update("phone")} /></Field>
              </EditSection>
            </div>
            {error && <p role="alert" className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => setEditing(false)} disabled={saving} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-[var(--theme-orange)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button>
            </div>
          </form>
        ) : (
          <section className="rounded-2xl border border-[var(--theme-border)] bg-white p-6 shadow-sm">
            <div className="mb-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-full bg-[var(--theme-navy)] text-4xl font-bold text-white shadow-sm ring-4 ring-white">
                {avatarSource ? <img src={avatarSource} alt="Profile" className="h-full w-full object-cover" /> : getInitials(profile || user)}
              </div>
              <label htmlFor="recruiter-avatar-upload-display" className="cursor-pointer rounded-lg bg-[var(--theme-orange)] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-95">Upload Photo</label>
              <input id="recruiter-avatar-upload-display" type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleAvatarSelect} />
              <p className="text-xs text-slate-400">JPG, PNG, Max 2MB</p>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[var(--theme-navy)]">My Profile</h2>
              </div>
              <button type="button" onClick={beginEditing} className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700">✎ Edit</button>
            </div>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><SettingDetail label="Full Name" value={valueOrPending(profile?.full_name)} /><SettingDetail label="Designation" value={valueOrPending(profile?.headline || profile?.job_title)} /><SettingDetail label="Email Address" value={valueOrPending(profile?.email)} /><SettingDetail label="Mobile Number" value={valueOrPending(profile?.phone)} /><SettingDetail label="Alternate Number" value="Not provided" /><SettingDetail label="Date of Joining" value="Not provided" /><SettingDetail label="About Me" value={valueOrPending(profile?.headline)} /></dl>
          </section>
        ))}
        {section === "company" && <DisplaySection title="Company Profile" description="Verified company information used across your job postings."><SettingDetail label="Company name" value={valueOrPending(profile?.company_name)} /><SettingDetail label="Website" value={valueOrPending(profile?.company_website)} isLink={Boolean(profile?.company_website)} /><SettingDetail label="Address" value={valueOrPending(profile?.company_address)} /><SettingDetail label="Tax ID" value={valueOrPending(profile?.company_tax_id)} /></DisplaySection>}
        {section === "security" && <DisplaySection title="Account & Security" description="Your account is protected through OTP authentication."><SettingDetail label="Sign-in method" value={profile?.email || profile?.phone || "Not provided"} /><SettingDetail label="Account role" value="Recruiter" /></DisplaySection>}
        {section === "notifications" && <section className="rounded-2xl border border-[var(--theme-border)] bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-[var(--theme-navy)]">Notification Preferences</h2><p className="mt-1 text-sm text-slate-500">Choose how you receive hiring and platform updates.</p><PreferenceToggle label="Email Notifications" description="Receive updates by email." checked={notificationPreferences.email_notifications} onChange={(value) => setNotificationPreferences((current) => ({ ...current, email_notifications: value }))} /><PreferenceToggle label="Application Updates" description="Receive application and interview updates." checked={notificationPreferences.application_updates} onChange={(value) => setNotificationPreferences((current) => ({ ...current, application_updates: value }))} /><PreferenceToggle label="SMS / WhatsApp Alerts" description="Receive time-sensitive alerts by SMS or WhatsApp." checked={notificationPreferences.sms_alerts} onChange={(value) => setNotificationPreferences((current) => ({ ...current, sms_alerts: value }))} />{error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}{notificationMessage && <p role="status" className="mt-4 text-sm text-emerald-700">{notificationMessage}</p>}<button type="button" disabled={notificationSaving} onClick={saveNotificationPreferences} className="mt-5 rounded-lg bg-[var(--theme-orange)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{notificationSaving ? "Saving..." : "Save Preferences"}</button></section>}
        {section === "profile" && <div className="mt-8">
          <DangerZone role="recruiter" onDeleted={onDeleteAccount} />
        </div>}</div></div>
      </div>
    </main>
  );
}

function DisplaySection({ title, description, children }) {
  return <section className="rounded-2xl border border-[var(--theme-border)] bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-[var(--theme-navy)]">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p><dl className="mt-5 space-y-4 text-sm">{children}</dl></section>;
}

function EditSection({ title, children }) {
  return <section><h2 className="text-lg font-semibold text-[var(--theme-navy)]">{title}</h2><div className="mt-5 space-y-4">{children}</div></section>;
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span><span className="block [&_input]:block [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-300 [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:outline-none [&_input:focus]:border-[var(--theme-orange)] [&_textarea]:block [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm [&_textarea]:outline-none [&_textarea:focus]:border-[var(--theme-orange)]">{children}</span></label>;
}

function SettingDetail({ label, value, isLink = false }) {
  return <div className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 break-words font-medium text-slate-800">{isLink ? <a href={value} target="_blank" rel="noreferrer" className="text-[var(--theme-orange)] hover:underline">{value}</a> : value}</dd></div>;
}

function PreferenceToggle({ label, description, checked, onChange }) { return <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 border-t border-slate-100 pt-4"><span><span className="block text-sm font-semibold text-slate-800">{label}</span><span className="mt-1 block text-xs text-slate-500">{description}</span></span><input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-slate-300 p-0.5 transition checked:bg-[var(--theme-orange)] before:block before:h-4 before:w-4 before:rounded-full before:bg-white before:transition checked:before:translate-x-4" /></label>; }
