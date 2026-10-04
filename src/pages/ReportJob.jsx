import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import PublicPageLayout from "./PublicPageLayout.jsx";

export default function ReportJob({ currentUser }) {
  const [submitted, setSubmitted] = useState(false);
  function submitReport(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Job posting report: ${fields.get("company")}`);
    const body = encodeURIComponent(`Reporter: ${currentUser.email || currentUser.full_name || currentUser.id}\nCompany / Job ID: ${fields.get("company")}\nReason: ${fields.get("reason")}\n\nDetails:\n${fields.get("details")}`);
    window.location.href = `mailto:support@mycareerpath.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }
  if (!currentUser || currentUser.role !== "candidate") {
    return <Navigate to="/#auth" replace state={{ authNotice: "Please log in as a Candidate to report a job posting." }} />;
  }
  return <PublicPageLayout title="Report a Fraudulent Job Posting" eyebrow="Candidate safety">
    <p>Help keep MyCareerPath safe by flagging suspicious recruiters or policy violations.</p>
    {submitted ? <p role="status" className="rounded-xl bg-emerald-50 p-5 font-semibold text-emerald-800">Your email app should open with the report addressed to support@mycareerpath.com. Send the message to submit it for review.</p> : <form onSubmit={submitReport} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <label className="block text-sm font-semibold">Company name / Job ID<input name="company" required className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      <label className="block text-sm font-semibold">Reason for report<select name="reason" required defaultValue="" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"><option value="" disabled>Select a reason</option><option>Payment request or suspected fraud</option><option>Misleading job details</option><option>Impersonation or suspicious recruiter</option><option>Other policy violation</option></select></label>
      <label className="block text-sm font-semibold">Details and evidence<textarea name="details" required rows="5" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      <button className="w-full rounded-xl bg-blue-900 py-3 font-semibold text-white hover:bg-blue-800">Submit Incident Report</button>
    </form>}
    <Link to="/fraud-alert" className="font-semibold text-blue-800 underline">Read our Fraud Alert policy</Link>
  </PublicPageLayout>;
}
