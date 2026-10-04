import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { api, auth } from "../api.js";
import ForgotPasswordModal from "./modals/ForgotPasswordModal.jsx";

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-orange-100";

export default function RecruiterModal({ onClose, onSuccess }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("enquiry");
  const [authView, setAuthView] = useState("login");
  const [loginWith, setLoginWith] = useState("email");
  const [hiringType, setHiringType] = useState("company");
  const [formData, setFormData] = useState({ fullName: "", mobileNumber: "", workEmail: "" });
  const [registrationData, setRegistrationData] = useState({ email: "", mobileNumber: "", fullName: "" });
  const [registrationStep, setRegistrationStep] = useState("details");
  const [registrationIdentifier, setRegistrationIdentifier] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [registrationPassword, setRegistrationPassword] = useState("");
  const [devCode, setDevCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === "login") setAuthView("login");
    setMessage("");
    setError("");
  };

  const updateField = (field) => (event) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
  };

  const submitEnquiry = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:8000").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/api/v1/recruiter/sales-enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.fullName,
          mobile_number: formData.mobileNumber,
          work_email: formData.workEmail,
          hiring_for: hiringType,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Failed to submit request.");

      setMessage(data.message || "Callback request submitted successfully. Our team will contact you shortly.");
      setFormData({ fullName: "", mobileNumber: "", workEmail: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const result = await api.login({ identifier: loginData.email, password: loginData.password, role: "recruiter" });
      auth.setTokens(result);
      onClose?.();
      onSuccess?.();
      navigate("/recruiter/overview");
    } catch (err) {
      setError(err?.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitRegistration = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      const identifier = loginWith === "email"
        ? registrationData.email.trim()
        : registrationData.mobileNumber.trim();
      const result = await api.sendOtp({
        identifier,
        full_name: registrationData.fullName.trim(),
        role: "recruiter",
        is_signup: true,
      });
      setRegistrationIdentifier(result.identifier || identifier);
      setDevCode(result.dev_code || "");
      setRegistrationStep("verify");
      setMessage("We sent a verification code to your email or mobile.");
    } catch (err) {
      setError(err?.message || "Unable to send verification code.");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyRegistration = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      await api.verifyOtp({
        identifier: registrationIdentifier,
        code: registrationCode,
        role: "recruiter",
        is_signup: true,
      });
      setRegistrationStep("password");
    } catch (err) {
      setError(err?.message || "Verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const completeRegistration = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      const result = await api.register({
        identifier: registrationIdentifier,
        password: registrationPassword,
        role: "recruiter",
        full_name: registrationData.fullName.trim(),
      });
      auth.setTokens(result);
      onClose?.();
      onSuccess?.();
      navigate("/recruiter/overview");
    } catch (err) {
      setError(err?.message || "Unable to create recruiter account.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateRegistrationField = (field) => (event) => {
    setRegistrationData((current) => ({ ...current, [field]: event.target.value }));
  };

  return (
    <>
    <div
      className={showForgotPasswordModal ? "hidden" : "fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"}
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="recruiter-modal-title"
        className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pb-4 pt-6 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F97316]">Hire with confidence</p>
            <h2 id="recruiter-modal-title" className="mt-1 text-2xl font-extrabold text-[#1E3A8A]">For Recruiters</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close recruiter modal" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
            <X size={21} />
          </button>
        </div>

        <div className="mx-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 sm:mx-8" role="tablist" aria-label="Recruiter options">
          <button type="button" role="tab" aria-selected={activeTab === "enquiry"} onClick={() => switchTab("enquiry")} className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${activeTab === "enquiry" ? "bg-white text-[#1E3A8A] shadow-sm" : "text-slate-500"}`}>Sales enquiry</button>
          <button type="button" role="tab" aria-selected={activeTab === "login"} onClick={() => switchTab("login")} className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${activeTab === "login" ? "bg-white text-[#1E3A8A] shadow-sm" : "text-slate-500"}`}>Register/Log in</button>
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === "enquiry" ? (
            <form className="space-y-4" onSubmit={submitEnquiry}>
              <p className="text-sm leading-6 text-slate-600">Find the right people faster. Leave your details and our hiring specialists will be in touch.</p>
              <label className="block text-sm font-semibold text-slate-700">Full Name<input required value={formData.fullName} onChange={updateField("fullName")} autoComplete="name" placeholder="Your full name" className={inputClass} /></label>
              <label className="block text-sm font-semibold text-slate-700">Mobile Number<input required value={formData.mobileNumber} onChange={updateField("mobileNumber")} type="tel" inputMode="tel" autoComplete="tel" placeholder="Enter mobile number" className={inputClass} /></label>
              <label className="block text-sm font-semibold text-slate-700">Work Email<input required value={formData.workEmail} onChange={updateField("workEmail")} type="email" autoComplete="email" placeholder="you@company.com" className={inputClass} /></label>
              <fieldset>
                <legend className="text-sm font-semibold text-slate-700">I am hiring for</legend>
                <div className="mt-2 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                  {[['company', 'Your company'], ['consultancy', 'Your consultancy']].map(([value, label]) => <button key={value} type="button" onClick={() => setHiringType(value)} aria-pressed={hiringType === value} className={`rounded-lg px-2 py-2.5 text-sm font-semibold transition ${hiringType === value ? "bg-white text-[#1E3A8A] shadow-sm" : "text-slate-500"}`}>{label}</button>)}
                </div>
              </fieldset>
              {message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</p>}
              {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
              <button disabled={submitting} type="submit" className="w-full rounded-xl bg-[#F97316] py-3 font-bold text-white transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Submitting…" : "Request callback"}</button>
            </form>
          ) : authView === "register" && registrationStep === "details" ? (
            <form className="space-y-4" onSubmit={submitRegistration}>
              <div>
                <h3 className="text-xl font-extrabold text-[#1E3A8A]">Register as Recruiter</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">Manage pipelines, shortlists, and interviews.</p>
              </div>
              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-wider text-slate-700">LOGIN WITH:</legend>
                <div className="mt-2 flex gap-6">
                  <label className="text-sm text-slate-700"><input type="radio" checked={loginWith === "email"} onChange={() => setLoginWith("email")} /> Email</label>
                  <label className="text-sm text-slate-700"><input type="radio" checked={loginWith === "mobile"} onChange={() => setLoginWith("mobile")} /> Mobile</label>
                </div>
              </fieldset>
              {loginWith === "email" ? <label className="block text-sm font-semibold text-slate-700">EMAIL ADDRESS<input required type="email" value={registrationData.email} onChange={updateRegistrationField("email")} autoComplete="email" placeholder="you@company.com" className={inputClass} /></label> : <label className="block text-sm font-semibold text-slate-700">MOBILE NUMBER<input required type="tel" value={registrationData.mobileNumber} onChange={updateRegistrationField("mobileNumber")} inputMode="tel" autoComplete="tel" placeholder="Enter mobile number" className={inputClass} /></label>}
              <label className="block text-sm font-semibold text-slate-700">FULL NAME<input required type="text" value={registrationData.fullName} onChange={updateRegistrationField("fullName")} autoComplete="name" placeholder="Your full name" className={inputClass} /></label>
              {message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</p>}
              {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
              <button disabled={submitting} type="submit" className="w-full rounded-xl bg-[#F97316] py-3 font-bold text-white transition hover:bg-[#ea580c] disabled:opacity-60">{submitting ? "Sending OTP…" : "Send OTP"}</button>
              <p className="text-center text-sm text-slate-600">Already have an account? <button type="button" onClick={() => { setAuthView("login"); setMessage(""); }} className="font-bold text-[#1E3A8A] hover:underline">Log in</button></p>
            </form>
          ) : authView === "register" && registrationStep === "verify" ? (
            <form className="space-y-4" onSubmit={verifyRegistration}>
              <div>
                <h3 className="text-xl font-extrabold text-[#1E3A8A]">Verify your account</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">Enter the code sent to {registrationIdentifier}.</p>
              </div>
              {import.meta.env.DEV && devCode && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">Development OTP: <strong>{devCode}</strong></p>}
              <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={registrationCode} onChange={(event) => setRegistrationCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit verification code" className={inputClass} />
              {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
              <button disabled={submitting} type="submit" className="w-full rounded-xl bg-[#F97316] py-3 font-bold text-white transition hover:bg-[#ea580c] disabled:opacity-60">{submitting ? "Verifying…" : "Verify OTP"}</button>
              <button type="button" onClick={() => { setRegistrationStep("details"); setRegistrationCode(""); setDevCode(""); setMessage(""); setError(""); }} className="w-full text-sm font-semibold text-slate-600 hover:underline">Back</button>
            </form>
          ) : authView === "register" ? (
            <form className="space-y-4" onSubmit={completeRegistration}>
              <div>
                <h3 className="text-xl font-extrabold text-[#1E3A8A]">Create your password</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">Your contact is verified. Choose a password to finish registration.</p>
              </div>
              <input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={registrationPassword} onChange={(event) => setRegistrationPassword(event.target.value)} placeholder="Password (8+ characters)" className={inputClass} />
              {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
              <button disabled={submitting} type="submit" className="w-full rounded-xl bg-[#F97316] py-3 font-bold text-white transition hover:bg-[#ea580c] disabled:opacity-60">{submitting ? "Creating account…" : "Create account"}</button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={submitLogin}>
              <p className="text-sm leading-6 text-slate-600">Access your recruiter workspace to manage jobs and candidates.</p>
              <label className="block text-sm font-semibold text-slate-700">Email ID<input required type="email" value={loginData.email || ""} onChange={(event) => setLoginData((current) => ({ ...current, email: event.target.value }))} autoComplete="username" placeholder="you@company.com" className={inputClass} /></label>
              <label className="block text-sm font-semibold text-slate-700">Password<input required type="password" value={loginData.password || ""} onChange={(event) => setLoginData((current) => ({ ...current, password: event.target.value }))} autoComplete="current-password" placeholder="Enter password" className={inputClass} /></label>
              <button type="button" onClick={() => setShowForgotPasswordModal(true)} className="text-sm font-bold text-[#1E3A8A] hover:underline">Forgot password?</button>
              {message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</p>}
              {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
              <button disabled={submitting} type="submit" className="w-full rounded-xl bg-[#1E3A8A] py-3 font-bold text-white transition hover:bg-[#16306f] disabled:opacity-60">{submitting ? "Logging in…" : "Log in"}</button>
              <p className="text-center text-sm text-slate-600">New to MyCareerPath? <button type="button" onClick={() => { setAuthView("register"); setMessage(""); }} className="font-bold text-[#F97316] hover:underline">Create account</button></p>
            </form>
          )}
        </div>
      </section>
    </div>
    <ForgotPasswordModal isOpen={showForgotPasswordModal} initialIdentifier={loginData.email || ""} onClose={() => setShowForgotPasswordModal(false)} />
    </>
  );
}
