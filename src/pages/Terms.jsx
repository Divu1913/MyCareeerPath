import PublicPageLayout from "./PublicPageLayout.jsx";

export default function Terms() {
  return <PublicPageLayout title="Terms & Conditions" eyebrow="Legal">
    <h2 className="text-xl font-bold text-slate-900">Using MyCareerPath</h2><p>Use the platform lawfully, provide accurate account information, and keep your sign-in credentials secure. You are responsible for activity performed through your account.</p>
    <h2 className="text-xl font-bold text-slate-900">Acceptable use</h2><p>Do not impersonate another person, post misleading opportunities, misuse candidate data, interfere with platform operations, or use the service to distribute unlawful or harmful material.</p>
    <h2 className="text-xl font-bold text-slate-900">Content and intellectual property</h2><p>Users retain rights to content they submit while granting MyCareerPath permission to host and process it to operate the service. MyCareerPath branding, software, and original platform content remain protected by applicable intellectual-property laws.</p>
    <h2 className="text-xl font-bold text-slate-900">Hiring outcomes</h2><p>MyCareerPath provides tools and recommendations but does not guarantee a job, interview, or placement. Users should independently verify opportunities and never pay for a promised placement.</p>
  </PublicPageLayout>;
}
