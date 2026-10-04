import { Link } from "react-router-dom";

export default function PublicPageLayout({ title, eyebrow = "MyCareerPath", children }) {
  return (
    <div className="min-h-screen bg-[#fffdf5] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="text-lg font-extrabold text-[#1e3a8a]">MyCareer<span className="text-orange-500">Path</span></Link>
          <Link to="/#landing" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-12">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black text-[#102a5e] sm:text-4xl">{title}</h1>
        <div className="mt-7 space-y-5 leading-7 text-slate-700">{children}</div>
      </main>
      <footer className="border-t border-slate-200 bg-white px-5 py-5 text-center text-xs text-slate-500">© 2026 MyCareerPath. All rights reserved.</footer>
    </div>
  );
}
