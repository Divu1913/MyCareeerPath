import { Link } from "react-router-dom";

const footerColumns = [
  { title: "Important Links", links: [{ label: "Employer Home", action: "recruiterModal" }, { label: "About Us", to: "/about" }, { label: "Contact Us", to: "/contact" }, { label: "Fraud Alert", to: "/fraud-alert" }] },
  { title: "Job Seekers", links: [{ label: "Register / Login", to: "/#auth" }, { label: "Job Search", to: "/jobs" }, { label: "Create Free Job Alert", to: "/jobs?alert=true" }, { label: "Resume Tools", to: "/candidate/resume-tools" }, { label: "AI Interview Prep", to: "/candidate/ai-prep" }, { label: "Courses", to: "/courses" }] },
  { title: "Resources", links: [{ label: "Business News", to: "/business-news" }, { label: "Employer Guidelines", to: "/employer-guidelines" }, { label: "Disclaimers", to: "/disclaimers" }] },
  { title: "Employers", links: [{ label: "Register / Log In", action: "recruiterModal" }, { label: "Recruiter India", to: "/recruiter/overview" }, { label: "Post a Job", action: "postJob" }] },
];

function FooterLink({ item, onOpenRecruiterModal, onPostJob }) {
  const className = "transition hover:text-white hover:underline";
  if (item.action === "recruiterModal") return <button type="button" onClick={onOpenRecruiterModal} className={className}>{item.label}</button>;
  if (item.action === "postJob") return <button type="button" onClick={onPostJob} className={className}>{item.label}</button>;
  return <Link to={item.to} className={className}>{item.label}</Link>;
}

/** Public footer shared by the landing and informational pages. */
export default function Footer({ onOpenAdminModal, onOpenRecruiterModal, onPostJob }) {
  return (
    <footer className="bg-[#061b46] text-[#c7d5ee]">
      <div className="mx-auto max-w-7xl px-6 pt-12 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white">{column.title}</h2>
              <ul className="mt-5 space-y-3 text-sm">
                {column.links.map((item) => <li key={item.label}><FooterLink item={item} onOpenRecruiterModal={onOpenRecruiterModal} onPostJob={onPostJob} /></li>)}
                {column.title === "Important Links" && <li><button type="button" onClick={onOpenAdminModal} className="font-semibold text-[#d9e6fb] transition hover:text-white hover:underline">🔒 Admin Portal</button></li>}
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><Link to="/terms" className="hover:text-white hover:underline">Terms &amp; Conditions</Link><Link to="/privacy-policy" className="hover:text-white hover:underline">Privacy Policy</Link><Link to="/cookie-policy" className="hover:text-white hover:underline">Cookie Policy</Link><Link to="/report-job" className="hover:text-white hover:underline">Report Job Posting</Link></div>
        <div className="flex items-center gap-3" aria-label="Social media"><a href="#facebook" aria-label="Facebook" className="font-bold hover:text-white">f</a><a href="#instagram" aria-label="Instagram" className="text-sm hover:text-white">◉</a><a href="#linkedin" aria-label="LinkedIn" className="font-bold hover:text-white">in</a><a href="#youtube" aria-label="YouTube" className="hover:text-white">▶</a></div>
      </div>
    </footer>
  );
}
