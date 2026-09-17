// UserProfile — full candidate profile page.
//
// Sections:
//   1. Header (avatar, name, role badge, headline, location)
//   2. Contact Information
//   3. Work Experience  (localStorage)
//   4. Education        (localStorage + AddEducationModal)
//   5. Skills           (localStorage + EditSkillsModal)
//   6. Certifications   (localStorage + AddCertificationModal)
//   7. My Activities    (real applications from api.getApplications)
//
// Skills, certifications, education, and experience live in localStorage.
// Contact details are persisted through PUT /api/users/{id}.
//
// Props: user (from api.me()), onBack fn, onLogout fn

import { useState, useEffect, useCallback, useRef } from "react";
import { Pencil } from "lucide-react";
import { api } from "../../api.js";
import EditSkillsModal from "../../components/modals/EditSkillsModal.jsx";
import AddCertificationModal from "../../components/modals/AddCertificationModal.jsx";
import AddEducationModal from "../../components/modals/AddEducationModal.jsx";
import AddExperienceModal from "../../components/modals/AddExperienceModal.jsx";
import EditContactModal from "../../components/modals/EditContactModal.jsx";
import ProfileDropdown from "../../components/ProfileDropdown.jsx";
import DangerZone from "../../components/DangerZone.jsx";

// ─── helpers ────────────────────────────────────────────────────────────────

function initials(user) {
  const name = user?.full_name || user?.email || "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function profileKey(user) {
  return `mcp_profile_${user?.id || user?._id || "anon"}`;
}

function loadProfile(user) {
  try {
    return JSON.parse(localStorage.getItem(profileKey(user)) || "{}");
  } catch {
    return {};
  }
}

function formatMonth(yyyyMM) {
  if (!yyyyMM) return "";
  const [y, m] = yyyyMM.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return m ? `${months[parseInt(m, 10) - 1]} ${y}` : y;
}

// ─── sub-components ─────────────────────────────────────────────────────────

function SectionCard({ title, action, actionLabel = "Edit", children }) {
  return (
    <section className="rounded-2xl border border-[var(--theme-border)] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[var(--theme-navy)]">{title}</h2>
        {action && (
          <button type="button" onClick={action}
            className="rounded-lg border border-[var(--theme-orange)] px-3 py-1.5 text-xs font-semibold text-[var(--theme-orange)] hover:bg-orange-50 transition">
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ label, onClick, cta = "Add" }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <p className="text-sm text-slate-400 mb-3">{label}</p>
      {onClick && (
        <button type="button" onClick={onClick}
          className="rounded-lg bg-[var(--theme-orange)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition">
          {cta}
        </button>
      )}
    </div>
  );
}

// ─── main page ──────────────────────────────────────────────────────────────

export default function UserProfile({ user, onBack, onProfile, onDashboard, onSettings, onLogout, onUpdateUser, onDeleteAccount }) {
  const userId = user?.id || user?._id || "anon";

  // Rich profile and a local cache of persisted contact details.
  const [profile, setProfile] = useState(() => loadProfile(user));

  // Real application stats from backend
  const [appCount, setAppCount] = useState(null);
  const [appLoading, setAppLoading] = useState(true);

  // Modal state
  const [modal, setModal] = useState(null); // null | skills | cert | edu | exp | contact
  const [editTarget, setEditTarget] = useState(null); // item being edited
  const [photoError, setPhotoError] = useState("");
  const [photoSaving, setPhotoSaving] = useState(false);
  const photoInputRef = useRef(null);


  // Reload profile from localStorage whenever we save
  const refresh = useCallback(() => setProfile(loadProfile(user)), [user]);

  // Fetch application count
  useEffect(() => {
    let cancelled = false;
    api.getApplications({ page: 1, size: 100 })
      .then((data) => {
        if (cancelled) return;
        const count = Array.isArray(data) ? data.length : (Array.isArray(data?.items) ? data.items.length : 0);
        setAppCount(count);
      })
      .catch(() => { if (!cancelled) setAppCount(0); })
      .finally(() => { if (!cancelled) setAppLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── derived values ──────────────────────────────────────────────────────
  const skills = profile.skills || [];
  const certifications = profile.certifications || [];
  const education = profile.education || [];
  const experience = profile.experience || [];
  const contactProfile = {
    location: profile.location || user?.location || "",
    state: profile.state || user?.state || "",
    district: profile.district || user?.district || "",
    local_address: profile.local_address || user?.local_address || "",
    linkedin: profile.linkedin_url || profile.linkedin || user?.linkedin_url || user?.linkedin || "",
    github: profile.github_url || user?.github_url || "",
    leetcode: profile.leetcode_url || user?.leetcode_url || "",
    website: profile.website || user?.website || "",
    headline: profile.headline || user?.headline || "",
  };

  const display = user?.full_name || user?.email || user?.phone || "Candidate";
  const email = user?.email || "";
  const phone = user?.phone || "";
  const role = user?.role || "candidate";

  // ── experience helpers ──────────────────────────────────────────────────
  function saveExperience(updated) {
    const stored = loadProfile(user);
    localStorage.setItem(profileKey(user), JSON.stringify({ ...stored, experience: updated }));
    refresh();
    setModal(null);
    setEditTarget(null);
  }

  function openAddExp() { setEditTarget(null); setModal("exp"); }
  function openEditExp(item) {
    setEditTarget(item);
    setModal("exp");
  }
  function deleteExp(id) {
    const updated = experience.filter((e) => e.id !== id);
    saveExperience(updated);
  }

  async function saveContact(contact) {
    const updated = await api.updateProfile(userId, contact);
    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    const stored = loadProfile(user);
    localStorage.setItem(profileKey(user), JSON.stringify({ ...stored, ...contact }));
    refresh();
    setModal(null);
  }

  async function uploadProfilePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError("File size exceeds 10MB limit. Please choose a smaller image.");
      return;
    }
    setPhotoError("");
    setPhotoSaving(true);
    try {
      const updated = await api.uploadProfilePhoto(file);
      const nextUser = { ...(user || {}), ...updated };
      onUpdateUser?.(nextUser);
      const stored = loadProfile(user);
      localStorage.setItem(profileKey(user), JSON.stringify({ ...stored, profile_photo_url: updated.profile_photo_url }));
      refresh();
    } catch (error) {
      setPhotoError(error?.message || "Could not upload profile photo.");
    } finally {
      setPhotoSaving(false);
    }
  }

  // ── render ──────────────────────────────────────────────────────────────
  return (
    <main className="candidate-profile min-h-screen bg-[var(--theme-cream)] text-slate-800">

      {/* Top nav bar */}
      <header className="border-b border-[var(--theme-border)] bg-white sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={onBack}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5">
              ← Back
            </button>
            <span className="text-sm font-semibold text-[var(--theme-navy)]">My Profile</span>
          </div>
          <ProfileDropdown user={user} onProfile={onProfile} onDashboard={onDashboard} onSettings={onSettings} onLogout={onLogout} />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">

        {/* ── 1. Profile header card ─────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--theme-border)] bg-white shadow-sm overflow-hidden">
          {/* Cover strip */}
          <div className="h-24 bg-gradient-to-r from-[var(--theme-navy)] to-blue-700" />
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-10 mb-3">
              <div className="relative inline-flex h-20 w-20">
                <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoSaving} aria-label="Upload profile photo" className="inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[var(--theme-orange)] text-2xl font-bold text-white ring-4 ring-white shadow-md disabled:opacity-60">
                  {user?.profile_photo_url ? <img src={user.profile_photo_url} alt={`${display} profile`} className="h-full w-full object-cover" /> : initials(user)}
                </button>
                <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoSaving} aria-label="Edit profile photo" title="Edit profile photo" className="absolute bottom-0 right-0 cursor-pointer rounded-full border-2 border-white bg-orange-500 p-2 text-white shadow-md hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
                  <Pencil size={13} strokeWidth={2.5} aria-hidden="true" />
                </button>
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={uploadProfilePhoto} className="hidden" />
              {photoError && <p role="alert" className="mt-2 max-w-xs text-sm font-medium text-red-600">{photoError}</p>}
            </div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[var(--theme-navy)]">{display}</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {contactProfile.headline || "Add a professional headline"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 capitalize">
                    {role}
                  </span>
                  {contactProfile.location && (
                    <span className="text-xs text-slate-500">📍 {contactProfile.location}</span>
                  )}
                  {email && <span className="text-xs text-slate-500">✉ {email}</span>}
                  {phone && <span className="text-xs text-slate-500">📞 {phone}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Contact Information ─────────────────────────────────────── */}
        <SectionCard title="Contact Information" action={() => setModal("contact")} actionLabel="Edit">
          <dl className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Email" value={email || "—"} />
            <InfoRow label="Phone" value={phone || "—"} />
            <InfoRow label="Location" value={contactProfile.location || "—"} />
            <InfoRow label="State" value={contactProfile.state || "—"} />
            <InfoRow label="District" value={contactProfile.district || "—"} />
            <InfoRow label="Local address" value={contactProfile.local_address || "—"} />
            <InfoRow label="LinkedIn" value={contactProfile.linkedin || "—"} link={contactProfile.linkedin} />
            <InfoRow label="GitHub" value={contactProfile.github || "—"} link={contactProfile.github} />
            <InfoRow label="LeetCode" value={contactProfile.leetcode || "—"} link={contactProfile.leetcode} />
            <InfoRow label="Portfolio / Website" value={contactProfile.website || "—"} link={contactProfile.website} />
          </dl>
        </SectionCard>

        {/* ── 3. Education ───────────────────────────────────────────────── */}
        <SectionCard title="Education" action={() => { setEditTarget(null); setModal("edu"); }} actionLabel="+ Add">
          {education.length === 0 ? (
            <EmptyState label="No education entries yet." onClick={() => { setEditTarget(null); setModal("edu"); }} cta="Add education" />
          ) : (
            <ul className="space-y-4">
              {education.map((e) => (
                <li key={e.id} className="relative rounded-xl border border-[var(--theme-border)] bg-[var(--theme-cream)] p-4">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--theme-navy)]">{e.degree}{e.field ? ` — ${e.field}` : ""}</p>
                      <p className="text-sm text-slate-600">{e.institution}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{e.startYear} — {e.endYear || "Present"}{e.grade ? ` · ${e.grade}` : ""}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => { setEditTarget(e); setModal("edu-edit"); }} className="rounded-md px-2 py-1 text-xs font-medium text-[var(--theme-orange)] hover:bg-orange-50 border border-[var(--theme-orange)]">Edit</button>
                      <button type="button" onClick={() => {
                        const updated = education.filter((ed) => ed.id !== e.id);
                        const stored = loadProfile(user);
                        localStorage.setItem(profileKey(user), JSON.stringify({ ...stored, education: updated }));
                        refresh();
                      }} className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-300">Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* ── 4. Skills ──────────────────────────────────────────────────── */}
        <SectionCard title="Skills" action={() => setModal("skills")} actionLabel="Edit skills">
          {skills.length === 0 ? (
            <EmptyState label="No skills added yet — let AI suggest some!" onClick={() => setModal("skills")} cta="Add skills" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="rounded-full bg-[var(--theme-navy)] text-white text-xs font-medium px-3 py-1.5">{s}</span>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ── 5. Certifications ──────────────────────────────────────────── */}
        <SectionCard title="Certifications" action={() => { setEditTarget(null); setModal("cert"); }} actionLabel="+ Add">
          {certifications.length === 0 ? (
            <EmptyState label="No certifications yet." onClick={() => { setEditTarget(null); setModal("cert"); }} cta="Add certification" />
          ) : (
            <ul className="space-y-3">
              {certifications.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-cream)] p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--theme-navy)]">{c.name}</p>
                    <p className="text-sm text-slate-600">{c.issuer}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatMonth(c.issueDate)}{c.expiryDate ? ` — ${formatMonth(c.expiryDate)}` : ""}
                    </p>
                    {c.credentialUrl && (
                      <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-[var(--theme-orange)] hover:underline">
                        View credential ↗
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => { setEditTarget(c); setModal("cert-edit"); }} className="rounded-md px-2 py-1 text-xs font-medium text-[var(--theme-orange)] hover:bg-orange-50 border border-[var(--theme-orange)]">Edit</button>
                    <button type="button" onClick={() => {
                      const updated = certifications.filter((x) => x.id !== c.id);
                      const stored = loadProfile(user);
                      localStorage.setItem(profileKey(user), JSON.stringify({ ...stored, certifications: updated }));
                      refresh();
                    }} className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-300">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* ── 6. Work Experience ─────────────────────────────────────────── */}
        <SectionCard title="Work Experience" action={openAddExp} actionLabel="+ Add">
          {experience.length === 0 ? (
            <EmptyState label="No experience added yet." onClick={openAddExp} cta="Add experience" />
          ) : (
            <ul className="space-y-4">
              {experience.map((e) => (
                <li key={e.id} className="relative rounded-xl border border-[var(--theme-border)] bg-[var(--theme-cream)] p-4">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--theme-navy)]">{e.title}</p>
                      <p className="text-sm text-slate-600">{e.company}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatMonth(e.startDate)} — {e.current ? "Present" : formatMonth(e.endDate)}
                      </p>
                      {e.description && <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{e.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => openEditExp(e)} className="rounded-md px-2 py-1 text-xs font-medium text-[var(--theme-orange)] hover:bg-orange-50 border border-[var(--theme-orange)]">Edit</button>
                      <button type="button" onClick={() => deleteExp(e.id)} className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-300">Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* ── 7. My Activities ───────────────────────────────────────────── */}
        <SectionCard title="My Activities">
          <div className="grid gap-4 sm:grid-cols-3">
            <ActivityStat label="Applications submitted" value={appLoading ? "—" : appCount} />
            <ActivityStat label="Skills listed" value={skills.length} />
            <ActivityStat label="Certifications" value={certifications.length} />
          </div>
        </SectionCard>

        <DangerZone role="candidate" onDeleted={onDeleteAccount} />

      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}

      {modal === "skills" && (
        <EditSkillsModal
          currentSkills={skills}
          userId={userId}
          onSave={(updated) => { refresh(); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}

      {(modal === "cert" || modal === "cert-edit") && (
        <AddCertificationModal
          initial={modal === "cert-edit" ? editTarget : null}
          userId={userId}
          existingList={certifications}
          onSave={(updated) => { refresh(); setModal(null); setEditTarget(null); }}
          onClose={() => { setModal(null); setEditTarget(null); }}
        />
      )}

      {(modal === "edu" || modal === "edu-edit") && (
        <AddEducationModal
          initial={modal === "edu-edit" ? editTarget : null}
          userId={userId}
          existingList={education}
          onSave={(updated) => { refresh(); setModal(null); setEditTarget(null); }}
          onClose={() => { setModal(null); setEditTarget(null); }}
        />
      )}

      {modal === "exp" && (
        <AddExperienceModal initial={editTarget} userId={userId} existingList={experience} onSave={saveExperience} onClose={() => { setModal(null); setEditTarget(null); }} />
      )}
      {modal === "contact" && <EditContactModal user={user} profile={contactProfile} onSave={saveContact} onClose={() => setModal(null)} />}
    </main>
  );
}

// ─── small helpers ───────────────────────────────────────────────────────────

function InfoRow({ label, value, link }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800 break-all">
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-[var(--theme-orange)] hover:underline">{value}</a>
        ) : value}
      </dd>
    </div>
  );
}

function ActivityStat({ label, value }) {
  return (
    <article className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-cream)] p-4 text-center">
      <p className="text-3xl font-bold text-[var(--theme-navy)]">{value ?? "—"}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </article>
  );
}
