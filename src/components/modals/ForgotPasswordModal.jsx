import { useEffect, useState } from "react";
import { api } from "../../api.js";

export default function ForgotPasswordModal({ isOpen, onClose, initialIdentifier = "", onComplete }) {
  const [step, setStep] = useState("send");
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [devCode, setDevCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep("send"); setIdentifier(initialIdentifier); setCode(""); setPassword(""); setDevCode(""); setError("");
  }, [isOpen, initialIdentifier]);

  if (!isOpen) return null;

  async function send(event) {
    event.preventDefault(); setError(""); setLoading(true);
    try { const result = await api.sendPasswordResetOtp({ identifier }); setIdentifier(result.identifier); setDevCode(result.dev_code || ""); setStep("reset"); }
    catch (err) { setError(err.message || "Unable to send a reset code."); }
    finally { setLoading(false); }
  }

  async function reset(event) {
    event.preventDefault(); setError(""); setLoading(true);
    try { await api.resetPassword({ identifier, code, password }); onComplete?.(); onClose?.(); }
    catch (err) { setError(err.message || "Unable to reset password."); }
    finally { setLoading(false); }
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={() => !loading && onClose?.()}><section role="dialog" aria-modal="true" aria-labelledby="forgot-password-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[var(--theme-orange)]">Account recovery</p><h2 id="forgot-password-title" className="mt-1 text-xl font-bold text-[var(--theme-navy)]">Reset your password</h2></div><button type="button" onClick={onClose} className="rounded px-2 text-xl text-slate-500 hover:bg-slate-100" aria-label="Close password reset">×</button></div>{step === "send" ? <form onSubmit={send} className="space-y-4"><p className="text-sm text-slate-600">Enter your registered email address or mobile number to receive a six-digit reset code.</p><input required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Email or mobile number" autoComplete="username" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[var(--theme-navy)]" />{error && <p className="rounded bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-[var(--theme-navy)] py-3 font-bold text-white disabled:opacity-60">{loading ? "Sending…" : "Send reset OTP"}</button></form> : <form onSubmit={reset} className="space-y-4"><p className="text-sm text-slate-600">Enter the code sent to <b>{identifier}</b> and choose a new password.</p>{devCode && <p className="rounded bg-amber-50 p-3 text-xs text-amber-900">Development reset code: <b>{devCode}</b></p>}<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="6-digit OTP" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[var(--theme-navy)]" /><input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password (8+ characters)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[var(--theme-navy)]" />{error && <p className="rounded bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-[var(--theme-navy)] py-3 font-bold text-white disabled:opacity-60">{loading ? "Resetting…" : "Reset password"}</button></form>}</section></div>;
}
