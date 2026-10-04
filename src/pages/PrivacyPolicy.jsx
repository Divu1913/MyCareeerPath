import PublicPageLayout from "./PublicPageLayout.jsx";

export default function PrivacyPolicy() {
  return <PublicPageLayout title="Privacy Policy" eyebrow="Legal">
    <p>MyCareerPath processes account details, contact information, qualification and skills data, resumes, applications, and recruiter information to provide career matching and hiring services.</p>
    <p>We do not sell candidate or recruiter data, resume details, or phone numbers. Information is shared only as needed to operate the service, support an application, comply with law, or with your direction, and is not shared with unverified third parties.</p>
    <h2 className="text-xl font-bold text-slate-900">Your choices</h2><p>Keep profile information current, review your notification preferences, and contact <a className="font-semibold text-blue-800 underline" href="mailto:support@mycareerpath.com">support@mycareerpath.com</a> with privacy questions or requests.</p>
  </PublicPageLayout>;
}
