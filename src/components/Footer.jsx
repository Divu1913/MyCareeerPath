const footerColumns = [
  { title: "Important Links", links: ["Employer Home", "About Us", "Contact Us", "Fraud Alert"] },
  { title: "Job Seekers", links: ["Register/Login", "Job Search", "Create Free Job Alert", "Job Assistance Services", "Courses"] },
  { title: "Resources", links: ["Business News", "Employer", "Disclaimers"] },
  { title: "Employers", links: ["Register/Log In", "Recruiter India", "Post a Job"] },
];

const linkHref = (label) => `#${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;

/** Landing-only footer. Admin access is deliberately separate from AuthForm. */
export default function Footer({ onOpenAdminLogin }) {
  return (
    <footer className="bg-[#061b46] text-[#c7d5ee]">
      <div className="mx-auto max-w-7xl px-6 pt-12 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white">{column.title}</h2>
              <ul className="mt-5 space-y-3 text-sm">
                {column.links.map((label) => <li key={label}><a href={linkHref(label)} className="transition hover:text-white hover:underline">{label}</a></li>)}
                {column.title === "Important Links" && <li><button type="button" onClick={onOpenAdminLogin} className="font-semibold text-[#d9e6fb] transition hover:text-white hover:underline">🔒 Admin Portal</button></li>}
              </ul>
            </nav>
          ))}
        </div>

        <section className="mt-12 flex flex-col items-start justify-between gap-4 rounded-xl border border-blue-400/25 bg-[#0a285d] px-5 py-5 sm:flex-row sm:items-center" aria-label="Download the MyCareerPath app">
          <div><p className="text-lg font-bold text-white">Download MyCareerPath</p><p className="mt-1 text-sm text-blue-200">Find opportunities and manage your applications on the go.</p></div>
          <a href="#get-app" className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#061b46] transition hover:bg-blue-100">Get App</a>
        </section>

        <section className="flex flex-col gap-4 border-b border-blue-900/80 py-8 sm:flex-row sm:items-center" aria-label="Partner institutions">
          <p className="shrink-0 text-xs font-bold uppercase tracking-[0.12em] text-blue-300">Partner institutions</p>
          <div className="flex flex-wrap gap-3"><div className="flex items-center gap-3 rounded-lg border border-blue-400/25 bg-white/5 px-3 py-2"><img src="/assets/logo.png" alt="MyCareerPath" className="h-8 w-8 rounded object-contain" /><span className="text-sm font-semibold text-white">P. R. Pote Patil College of Engineering</span></div><span className="rounded-lg border border-blue-400/25 bg-white/5 px-3 py-2 text-sm font-semibold text-blue-100">Career Partner Network</span></div>
        </section>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 text-xs sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>© 2026 MyCareerPath. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><a href="#terms" className="hover:text-white hover:underline">T&amp;C</a><a href="#privacy" className="hover:text-white hover:underline">Privacy Policy</a><a href="#cookie-policy" className="hover:text-white hover:underline">Cookie Policy</a><a href="#report-job-posting" className="hover:text-white hover:underline">Report Job Posting</a></div>
        <div className="flex items-center gap-3" aria-label="Social media"><a href="#facebook" aria-label="Facebook" className="font-bold hover:text-white">f</a><a href="#instagram" aria-label="Instagram" className="text-sm hover:text-white">◎</a><a href="#linkedin" aria-label="LinkedIn" className="font-bold hover:text-white">in</a><a href="#youtube" aria-label="YouTube" className="hover:text-white">▶</a></div>
      </div>
    </footer>
  );
}
