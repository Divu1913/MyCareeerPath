import { useEffect, useState } from "react";
import {
  EDUCATION_HIERARCHY,
  isEligible,
  normalizeQualification,
  qualificationLabel,
} from "../../utils/eligibility.js";

const inputCls = "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--theme-orange)]";

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected resume."));
    reader.readAsDataURL(file);
  });
}

function candidateQualification(profile, user) {
  return profile?.highest_education?.degree
    || profile?.highest_qualification
    || profile?.education?.slice(-1)[0]?.degree
    || user?.highest_qualification
    || "";
}

export default function ApplicationWizardModal({ job, profile = {}, user, onSubmit, onClose, submitting = false, error = "" }) {
  const [step, setStep] = useState(1);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeError, setResumeError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [localError, setLocalError] = useState("");

  const minimumQualification = job?.raw?.min_eligibility || job?.min_eligibility || "";
  const currentQualification = candidateQualification(profile, user);
  const educationMissing = !normalizeQualification(currentQualification);
  const educationMatches = !educationMissing && isEligible(currentQualification, minimumQualification);
  const existingResume = profile.resume_url || user?.resume_url || "";

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && !submitting && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  function next() {
    setLocalError("");
    if (step === 2 && educationMissing) {
      setLocalError("Education details missing. Please complete your profile education details before proceeding.");
      return;
    }
    if (step === 2 && !educationMatches) {
      setLocalError(`This role requires ${qualificationLabel(minimumQualification)} or above.`);
      return;
    }
    if (step === 3 && !resumeFile && !existingResume) {
      setResumeError("Upload a resume before continuing.");
      return;
    }
    setStep((current) => Math.min(4, current + 1));
  }

  function back() {
    setLocalError("");
    setResumeError("");
    setStep((current) => Math.max(1, current - 1));
  }

  async function submit(event) {
    event.preventDefault();
    if (!confirmed) {
      setLocalError("Confirm that your application details are accurate.");
      return;
    }
    setLocalError("");
    try {
      const resumeUrl = resumeFile ? await readAsDataUrl(resumeFile) : existingResume;
      await onSubmit({
        cover_letter: coverLetter.trim() || undefined,
        resume_url: resumeUrl || undefined,
      });
    } catch (submitError) {
      setLocalError(submitError?.message || "Could not prepare the resume.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="application-wizard-title">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--theme-orange)]">Step {step} of 4</p>
            <h2 id="application-wizard-title" className="mt-1 text-xl font-bold text-[var(--theme-navy)]">Apply for {job.title}</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">{job.company_name}</p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-lg px-2 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100" aria-label="Close application wizard">×</button>
        </header>

        <div className="space-y-6 px-6 py-5">
          {step === 1 && (
            <section className="space-y-4">
              <div><h3 className="text-base font-bold text-slate-800">Review job details and requirements</h3><p className="mt-1 text-sm text-slate-500">Make sure this opportunity matches what you are looking for.</p></div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600"><span>📍 {job.location}</span><span>💰 {job.salary}</span></div>
              <div><h4 className="text-sm font-bold text-slate-800">Description</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{job.raw?.description || "No description provided."}</p></div>
              <div><h4 className="text-sm font-bold text-slate-800">Required skills</h4><div className="mt-2 flex flex-wrap gap-2">{job.tags.length ? job.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{tag}</span>) : <span className="text-sm text-slate-500">No specific skills listed.</span>}</div></div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <div><h3 className="text-base font-bold text-slate-800">Verify education and background</h3><p className="mt-1 text-sm text-slate-500">Your profile qualification is checked against this job's minimum eligibility.</p></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your highest qualification</p><p className="mt-1 text-lg font-bold text-[var(--theme-navy)]">{qualificationLabel(currentQualification)}</p><p className="mt-3 text-xs text-slate-500">Education order: {EDUCATION_HIERARCHY.join(" → ")}</p></div>
              {educationMissing && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">Education details missing. Please complete your profile education details before proceeding.</p></div>}
              {!educationMissing && <div className={`rounded-xl border p-4 ${educationMatches ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}><p className={`text-sm font-semibold ${educationMatches ? "text-emerald-800" : "text-red-800"}`}>{minimumQualification ? `Minimum required: ${qualificationLabel(minimumQualification)}` : "No minimum qualification specified"}</p><p className={`mt-1 text-xs ${educationMatches ? "text-emerald-700" : "text-red-700"}`}>{educationMatches ? "Your profile meets this requirement." : "Update your profile education before applying for this role."}</p></div>}
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <div><h3 className="text-base font-bold text-slate-800">Upload your resume</h3><p className="mt-1 text-sm text-slate-500">A resume is required for every application.</p></div>
              <label className="block"><span className="text-sm font-semibold text-slate-700">Resume file</span><input type="file" accept=".pdf,.doc,.docx" onChange={(event) => { setResumeFile(event.target.files?.[0] || null); setResumeError(""); }} className={inputCls} /></label>
              {resumeFile && <p className="text-sm text-emerald-700">Selected: {resumeFile.name}</p>}
              {!resumeFile && existingResume && <p className="text-sm text-slate-600">A resume is already saved on your profile and will be used.</p>}
              {resumeError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{resumeError}</p>}
              <label className="block"><span className="text-sm font-semibold text-slate-700">Cover note <span className="font-normal text-slate-500">(optional)</span></span><textarea value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} rows={4} className={inputCls} placeholder="Introduce yourself to the recruiter." /></label>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-4"><div><h3 className="text-base font-bold text-slate-800">Confirm your submission</h3><p className="mt-1 text-sm text-slate-500">Review the final details before sending your application.</p></div><dl className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Role</dt><dd className="font-semibold text-slate-800">{job.title}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Education</dt><dd className="font-semibold text-slate-800">{qualificationLabel(currentQualification)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Resume</dt><dd className="font-semibold text-emerald-700">Ready to attach</dd></div></dl><label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 accent-[var(--theme-orange)]" />I confirm that my education, background, and resume details are accurate.</label></section>
          )}

          {(localError || error) && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{localError || error}</p>}
        </div>

        <footer className="sticky bottom-0 flex justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4"><button type="button" onClick={step === 1 ? onClose : back} disabled={submitting} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">{step === 1 ? "Cancel" : "Back"}</button>{step < 4 ? <button type="button" onClick={next} disabled={submitting || (step === 2 && (!educationMatches || educationMissing))} className="rounded-lg bg-[var(--theme-orange)] px-5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">Continue</button> : <button type="submit" disabled={submitting || !confirmed} className="rounded-lg bg-[var(--theme-orange)] px-5 py-2 text-sm font-bold text-white disabled:opacity-60">{submitting ? "Submitting..." : "Submit application"}</button>}</footer>
      </form>
    </div>
  );
}
