import { useState } from "react";
import PublicPageLayout from "./PublicPageLayout.jsx";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`MyCareerPath support request from ${fields.get("name")}`);
    const body = encodeURIComponent(`Name: ${fields.get("name")}\nEmail: ${fields.get("email")}\n\n${fields.get("message")}`);
    window.location.href = `mailto:support@mycareerpath.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }
  return <PublicPageLayout title="Contact our support team" eyebrow="Contact">
    <p>Email <a className="font-semibold text-blue-800 underline" href="mailto:support@mycareerpath.com">support@mycareerpath.com</a>. Our operating hours are 10:00 AM to 6:00 PM.</p>
    <p>Institutional partner: P. R. Pote Patil College of Engineering &amp; Management, Amravati.</p>
    {submitted ? <p role="status" className="rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-800">Thanks for contacting us. Please email support@mycareerpath.com and our team will follow up during operating hours.</p> : <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className="block text-sm font-semibold">Your name<input name="name" required className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      <label className="block text-sm font-semibold">Email<input name="email" required type="email" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      <label className="block text-sm font-semibold">How can we help?<textarea name="message" required rows="4" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      <button className="rounded-lg bg-blue-900 px-5 py-3 font-bold text-white">Send message</button>
    </form>}
  </PublicPageLayout>;
}
