import { useState } from "react";
import PublicPageLayout from "./PublicPageLayout.jsx";

export default function JobAlert() {
  const [saved, setSaved] = useState(false);
  return <PublicPageLayout title="Create a Free Job Alert" eyebrow="Candidate preferences">
    <p>Choose the roles and locations you want to hear about. MyCareerPath will use these preferences to help surface relevant opportunities.</p>
    {saved ? <p role="status" className="rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-800">Your alert preferences have been saved for this session.</p> : <form onSubmit={(event) => { event.preventDefault(); setSaved(true); }} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <label className="block text-sm font-semibold">Job title or skills<input required placeholder="e.g. Accountant, Python" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      <label className="block text-sm font-semibold">Preferred location<input required defaultValue="Amravati" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      <button className="rounded-lg bg-blue-900 px-5 py-3 font-bold text-white">Save alert</button>
    </form>}
  </PublicPageLayout>;
}
