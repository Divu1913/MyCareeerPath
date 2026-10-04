import PublicPageLayout from "./PublicPageLayout.jsx";

export default function BusinessNews() {
  return <PublicPageLayout title="Regional Hiring & Business News" eyebrow="Resources">
    <p>Regional hiring updates, local labor-market trends, and practical guidance for employers using MyCareerPath.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">Hiring closer to home</h2><p className="mt-2 text-sm">Local employers can widen access to talent across Amravati district by clearly listing location, eligibility, and work arrangements.</p></article>
      <article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">Skills and labor-market trends</h2><p className="mt-2 text-sm">Candidates can compare role requirements with their current skills and use learning recommendations to plan their next step.</p></article>
      <article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">Posting guidelines</h2><p className="mt-2 text-sm">Recruiters should keep job descriptions accurate, disclose eligibility requirements, and never request candidate fees.</p></article>
    </div>
  </PublicPageLayout>;
}
