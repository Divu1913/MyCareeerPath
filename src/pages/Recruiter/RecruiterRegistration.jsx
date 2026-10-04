import { useEffect, useRef, useState } from "react";
import { api, auth, formatAccountError } from "../../api.js";

function normalizeIndianPhone(raw) {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("910")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

const inputClass = "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none transition focus:ring-2 focus:ring-orange-100";

export default function RecruiterRegistration({ onSuccess, onHome }) {
  const [step, setStep] = useState("details");
  const [loginMethod, setLoginMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [devCode, setDevCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (step === "verify" && code.every(Boolean) && !loading) verifySignup();
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  function getIdentifier() {
    if (loginMethod === "email") {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) throw new Error("Please enter a valid email address.");
      return email.trim();
    }
    const normalized = normalizeIndianPhone(phone);
    if (!normalized) throw new Error("Please enter a valid 10-digit Indian mobile number.");
    return normalized;
  }

  async function sendOtp(event) {
    event.preventDefault();
    setError("");
    let value;
    try {
      value = getIdentifier();
    } catch (err) {
      setError(err.message);
      return;
    }
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    setLoading(true);
    try {
      const result = await api.sendOtp({ identifier: value, full_name: fullName.trim(), role: "recruiter", is_signup: true });
      setIdentifier(result.identifier);
      const developmentCode = result.dev_code || "";
      setDevCode(developmentCode);
      if (developmentCode) setCode(developmentCode.slice(0, 6).split("").concat(Array(6).fill("")).slice(0, 6));
      setStep("verify");
    } catch (err) {
      setError(formatAccountError(err, "Unable to send OTP"));
    } finally {
      setLoading(false);
    }
  }

  function updateCode(index, value) {
    const digits = value.replace(/\D/g, "");
    const next = [...code];
    if (digits.length > 1) digits.slice(0, 6).split("").forEach((digit, offset) => { if (index + offset < 6) next[index + offset] = digit; });
    else next[index] = digits;
    setCode(next);
    if (digits && index < 5) inputsRef.current[Math.min(index + digits.length, 5)]?.focus();
  }

  async function verifySignup(event) {
    event?.preventDefault();
    const joined = code.join("");
    if (joined.length !== 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.verifyOtp({ identifier, code: joined, role: "recruiter", is_signup: true });
      setStep("password");
    } catch (err) {
      setError(formatAccountError(err, "Verification failed"));
    } finally {
      setLoading(false);
    }
  }

  async function createAccount(event) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await api.register({ identifier, password, role: "recruiter", full_name: fullName.trim() });
      auth.setTokens(result);
      onSuccess?.();
    } catch (err) {
      setError(formatAccountError(err, "Unable to create account"));
    } finally {
      setLoading(false);
    }
  }

  return <div className="min-h-screen flex flex-col bg-[var(--theme-cream)]"><header className="w-full border-b border-slate-200 bg-[#fffdf5]/95"><div className="mx-auto flex h-16 max-w-3xl items-center justify-center px-4"><button type="button" onClick={onHome} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">← BACK to Home</button></div></header><main className="flex flex-1 items-center justify-center px-4 py-8"><div className="w-full max-w-md rounded-2xl border border-[var(--theme-border)] bg-white p-8 shadow-lg">{step === "details" ? <form onSubmit={sendOtp} className="space-y-5"><div><h1 className="text-xl font-bold text-slate-800">Register as Recruiter</h1><p className="mt-1 text-xs text-slate-500">Manage pipelines, shortlists, and interviews.</p></div><div><span className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Login with:</span><div className="mt-2 flex gap-6"><label className="text-sm"><input type="radio" checked={loginMethod === "email"} onChange={() => setLoginMethod("email")} /> Email</label><label className="text-sm"><input type="radio" checked={loginMethod === "mobile"} onChange={() => setLoginMethod("mobile")} /> Mobile</label></div></div>{loginMethod === "email" ? <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Email Address<input type="email" required value={email || ""} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="you@company.com" className={inputClass} /></label> : <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Mobile Number<div className="mt-1 flex"><span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">+91</span><input type="tel" required inputMode="numeric" maxLength={14} value={phone || ""} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 14))} autoComplete="tel-national" placeholder="9876543210" className="block w-full rounded-r-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none" /></div></label>}<label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Full Name<input type="text" required value={fullName || ""} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className={inputClass} /></label>{error && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-600">{error}</p>}<button disabled={loading} type="submit" className="w-full rounded-xl bg-[#d97706] py-3 font-bold text-white disabled:opacity-60">{loading ? "Sending code…" : "Send OTP"}</button></form> : step === "verify" ? <form onSubmit={verifySignup} className="space-y-6"><div><h1 className="text-xl font-bold text-slate-800">Verify your email or mobile</h1><p className="mt-1 text-xs text-slate-500">Enter the code sent to <b>{identifier}</b>.</p></div>{devCode && <p className="rounded border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">Development reset code: <b>{devCode}</b></p>}<div className="flex justify-between gap-2">{code.map((digit, index) => <input key={index} ref={(element) => { inputsRef.current[index] = element; }} value={digit || ""} onChange={(event) => updateCode(index, event.target.value)} onKeyDown={(event) => { if (event.key === "Backspace" && !code[index] && index) inputsRef.current[index - 1]?.focus(); }} inputMode="numeric" maxLength={6} className="h-14 w-12 rounded-lg border border-slate-300 text-center text-2xl font-bold" />)}</div>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-[#d97706] py-3 font-bold text-white disabled:opacity-60">{loading ? "Verifying…" : "Verify OTP"}</button></form> : <form onSubmit={createAccount} className="space-y-5"><div><h1 className="text-xl font-bold text-slate-800">Create your password</h1><p className="mt-1 text-xs text-slate-500">Your email/mobile is verified. Set a password to finish registration.</p></div><label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Password<input type="password" required minLength={8} value={password || ""} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className={inputClass} /></label>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-[#d97706] py-3 font-bold text-white disabled:opacity-60">{loading ? "Creating account…" : "Create Account"}</button></form>}</div></main></div>;
}
