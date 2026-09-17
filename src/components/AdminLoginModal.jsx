import { useEffect, useState } from "react";
import { api, auth } from "../api.js";

/**
 * A deliberately separate entry point for platform administrators. Public
 * candidate/recruiter authentication remains in AuthForm and uses its own
 * OTP flow; this modal only accepts the configured admin credentials.
 */
export default function AdminLoginModal({ isOpen, onClose, onSuccess }) {
  const [view, setView] = useState("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setView("login");
    setPassword("");
    setMessage("");
    setError("");
  }, [isOpen]);

  if (!isOpen) return null;

  const close = () => {
    if (!submitting) onClose?.();
  };

  async function submitLogin(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await api.adminLogin({ identifier, password });
      auth.setTokens(result);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Unable to sign in to the admin portal.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReset(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      await api.requestAdminPasswordReset({ email: identifier });
      setMessage("If that address belongs to the administrator, a reset link has been sent.");
    } catch (err) {
      setError(err?.message || "Unable to request a password reset.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={close}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-login-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--theme-orange)]">Restricted access</p>
            <h2 id="admin-login-title" className="mt-1 text-2xl font-extrabold text-[var(--theme-navy)]">
              {view === "login" ? "Admin Portal" : "Reset administrator password"}
            </h2>
          </div>
          <button type="button" onClick={close} className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100" aria-label="Close admin login">×</button>
        </div>

        {view === "login" ? (
          <form className="space-y-4" onSubmit={submitLogin}>
            <label className="block text-sm font-semibold text-slate-700">
              Email or username
              <input type="text" required autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="admin@example.com" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[var(--theme-navy)] focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Password
              <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[var(--theme-navy)] focus:ring-2 focus:ring-blue-100" />
            </label>
            {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
            <button disabled={submitting} type="submit" className="w-full rounded-xl bg-[var(--theme-navy)] py-3 font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Signing in…" : "Sign In"}
            </button>
            <button type="button" onClick={() => { setView("reset"); setError(""); }} className="w-full text-sm font-semibold text-[var(--theme-navy)] hover:underline">Forgot Password?</button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={submitReset}>
            <p className="text-sm leading-6 text-slate-600">Enter the configured admin email. If it matches, we’ll send a time-limited reset link.</p>
            <label className="block text-sm font-semibold text-slate-700">
              Admin email
              <input type="email" required autoComplete="email" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="admin@example.com" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[var(--theme-navy)] focus:ring-2 focus:ring-blue-100" />
            </label>
            {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
            {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{message}</p>}
            <button disabled={submitting} type="submit" className="w-full rounded-xl bg-[var(--theme-navy)] py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Sending…" : "Send reset link"}</button>
            <button type="button" onClick={() => { setView("login"); setError(""); setMessage(""); }} className="w-full text-sm font-semibold text-[var(--theme-navy)] hover:underline">Back to sign in</button>
          </form>
        )}
      </section>
    </div>
  );
}
