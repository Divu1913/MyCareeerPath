import { AlertTriangle, DollarSign, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import PublicPageLayout from "./PublicPageLayout.jsx";

export default function FraudAlert() {
  return <PublicPageLayout title="Fraud Alert & Security Notice" eyebrow="Stay safe">
    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
      <h2 className="flex items-center gap-2 text-xl font-extrabold text-amber-950"><AlertTriangle aria-hidden="true" /> Zero payment policy</h2>
      <p className="mt-3">MyCareerPath and legitimate recruiters on our platform will <strong>never charge candidates</strong> for internships, interviews, application fees, document verification, training, or security deposits.</p>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-[#102a5e]"><ShieldCheck aria-hidden="true" /> Protect your information</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6"><li>Never pay interview scheduling, processing, laptop distribution, or refundable deposit fees.</li><li>Do not share bank credentials, UPI PINs, or sensitive financial documents.</li><li>Verify recruiters and communicate through official platform channels or corporate email domains.</li></ul>
    </section>
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="flex items-center gap-2 text-lg font-bold text-red-900"><DollarSign aria-hidden="true" /> Platform non-liability</h2><p className="mt-2">Do not pay anyone claiming to guarantee placement. MyCareerPath assumes no financial liability for transactions made outside the official portal. Report suspicious postings through the <Link className="font-bold underline" to="/report-job">Report Job Posting</Link> page.</p></section>
  </PublicPageLayout>;
}
