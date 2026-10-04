import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, auth, formatAccountError, isAccountRoleConflict } from "../api.js";
import ForgotPasswordModal from "../components/modals/ForgotPasswordModal.jsx";

const ROLES = [
  { key: "candidate", label: "Candidate", accent: "#2563eb", subtitle: "Roles matched to your skills, tracked in one place." },
  { key: "recruiter", label: "Recruiter", accent: "#d97706", subtitle: "Manage pipelines, shortlists, and interviews." },
];

function normalizeIndianPhone(raw) {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("910")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export default function Auth({
  onSuccess,
  onHome,
  initialMode = "signin",
  initialRole = "candidate",
  notice = "",
}) {
  const navigate = useNavigate();
  const activeTab = initialRole === "recruiter" ? "recruiter" : "candidate";
  const [mode, setMode] = useState(initialMode === "signup" ? "signup" : "login");
  const [step, setStep] = useState("identifier");
  const [loginMethod, setLoginMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const inputsRef = useRef([]);

  const currentRole = ROLES.find((role) => role.key === activeTab) || ROLES[0];
  const inputClass =
    "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-100";

  useEffect(() => {
    setIdentifier(loginMethod === "email" ? email.trim() : (normalizeIndianPhone(phone) || phone.trim()));
  }, [loginMethod, email, phone]);

  useEffect(() => {
    if (mode === "signup" && step === "verify" && code.every(Boolean) && !loading) {
      verifySignup();
    }
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleHomeClick() {
    if (typeof onHome === "function") {
      onHome();
    } else {
      navigate("/");
    }
  }

  function getIdentifier() {
    if (loginMethod === "email") {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
        throw new Error("Please enter a valid email address.");
      }
      return email.trim();
    }
    const normalized = normalizeIndianPhone(phone);
    if (!normalized) {
      throw new Error("Please enter a valid 10-digit Indian mobile number.");
    }
    return normalized;
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setStep("identifier");
    setCode(["", "", "", "", "", ""]);
    setPassword("");
    setError("");
  }

  async function submitIdentifier(event) {
    event.preventDefault();
    setError("");
    let value;
    try {
      value = getIdentifier();
    } catch (err) {
      setError(err.message);
      return;
    }

    if (mode === "login") {
      if (!password) {
        setError("Password is required.");
        return;
      }
      setLoading(true);
      try {
        const result = await api.login({ identifier: value, password, role: activeTab });
        auth.setTokens(result);
        onSuccess?.();
      } catch (err) {
        setError(formatAccountError(err, "Unable to sign in"));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    setLoading(true);
    try {
      const result = await api.sendOtp({
        identifier: value,
        full_name: fullName.trim(),
        role: activeTab,
        is_signup: true,
      });
      setIdentifier(result.identifier);
      setStep("verify");
    } catch (err) {
      if (isAccountRoleConflict(err)) switchMode("login");
      setError(formatAccountError(err, "Unable to send OTP"));
    } finally {
      setLoading(false);
    }
  }

  function updateCode(index, value) {
    const digits = value.replace(/\D/g, "");
    const next = [...code];
    if (digits.length > 1) {
      digits.slice(0, 6).split("").forEach((digit, offset) => {
        if (index + offset < 6) next[index + offset] = digit;
      });
    } else {
      next[index] = digits;
    }
    setCode(next);
    if (digits && index < 5) {
      inputsRef.current[Math.min(index + digits.length, 5)]?.focus();
    }
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
      await api.verifyOtp({ identifier, code: joined, role: activeTab, is_signup: true });
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
      const result = await api.register({
        identifier,
        password,
        role: activeTab,
        full_name: fullName.trim(),
      });
      auth.setTokens(result);
      onSuccess?.();
    } catch (err) {
      setError(formatAccountError(err, "Unable to create account"));
    } finally {
      setLoading(false);
    }
  }

  const authForm =
    step === "identifier" ? (
      <form onSubmit={submitIdentifier} className="space-y-5">
        {notice && (
          <p role="status" className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            {notice}
          </p>
        )}

        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              mode === "login" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              mode === "signup" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Sign Up (Register)
          </button>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {mode === "login" ? `${currentRole.label} Sign In` : `Register as ${currentRole.label}`}
          </h1>
          <p className="mt-1 text-xs text-slate-500">{currentRole.subtitle}</p>
        </div>

        <div className="space-y-4">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Login with:
            </span>
            <div className="mt-2 flex gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  checked={loginMethod === "email"}
                  onChange={() => setLoginMethod("email")}
                  className="accent-blue-600"
                />
                Email
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  checked={loginMethod === "mobile"}
                  onChange={() => setLoginMethod("mobile")}
                  className="accent-blue-600"
                />
                Mobile
              </label>
            </div>
          </div>

          {loginMethod === "email" ? (
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Email Address
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                placeholder="you@example.com"
                className={`${inputClass} mt-1 font-normal`}
              />
            </label>
          ) : (
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Mobile Number
              <div className="mt-1 flex">
                <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  maxLength={14}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 14))}
                  autoComplete="tel-national"
                  placeholder="9876543210"
                  className="block w-full rounded-r-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </label>
          )}

          {mode === "login" ? (
            <>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Password
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className={`${inputClass} mt-1 font-normal`}
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: currentRole.accent }}
                >
                  Forgot Password?
                </button>
              </div>
            </>
          ) : (
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Full Name
              <input
                type="text"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                placeholder="Enter your full name"
                className={`${inputClass} mt-1 font-normal`}
              />
            </label>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-xl py-3 font-bold text-white transition hover:opacity-95 disabled:opacity-60"
          style={{ backgroundColor: currentRole.accent }}
        >
          {loading ? (mode === "login" ? "Signing in…" : "Sending code…") : mode === "login" ? "Sign In" : "Send OTP"}
        </button>
      </form>
    ) : step === "verify" ? (
      <form onSubmit={verifySignup} className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Verify your email or mobile</h1>
          <p className="mt-1 text-xs text-slate-500">
            Enter the code sent to <b>{identifier}</b>.
          </p>
        </div>

        <div className="flex justify-between gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputsRef.current[index] = element;
              }}
              value={digit}
              onChange={(event) => updateCode(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !code[index] && index) {
                  inputsRef.current[index - 1]?.focus();
                }
              }}
              inputMode="numeric"
              maxLength={6}
              className="h-14 w-12 rounded-lg border border-slate-300 text-center text-2xl font-bold outline-none focus:ring-2 focus:ring-blue-100"
            />
          ))}
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="w-full rounded-xl py-3 font-bold text-white transition hover:opacity-95 disabled:opacity-60"
          style={{ backgroundColor: currentRole.accent }}
        >
          {loading ? "Verifying…" : "Verify OTP"}
        </button>
      </form>
    ) : (
      <form onSubmit={createAccount} className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Create your password</h1>
          <p className="mt-1 text-xs text-slate-500">Your account is verified. Set a password to finish registration.</p>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
          Password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className={`${inputClass} mt-1 font-normal`}
          />
        </label>

        {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="w-full rounded-xl py-3 font-bold text-white transition hover:opacity-95 disabled:opacity-60"
          style={{ backgroundColor: currentRole.accent }}
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>
    );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--theme-cream,#faf8f5)]">
      {/* 
        Top Header Container:
        - Aligned with justify-between and items-center gap-4
        - Contains the MyCareerPath Logo brand linking to /
        - Sleek `← BACK to Home` button placed immediately next to the logo on the left side
        - NO centered banner
      */}
      <header className="w-full border-b border-slate-200 bg-[#fffdf5]/95 sticky top-0 z-30 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              onClick={(e) => {
                if (typeof onHome === "function") {
                  e.preventDefault();
                  onHome();
                }
              }}
              className="flex items-center gap-2 rounded-lg text-left transition hover:opacity-90"
              aria-label="Go to MyCareerPath home"
            >
              <img
                src="/assets/logo.png"
                alt="MyCareerPath"
                className="h-9 w-9 rounded-md object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span className="text-lg sm:text-xl font-bold tracking-tight text-[var(--theme-navy,#0f172a)]">
                MyCareer<span className="text-[var(--theme-orange,#f97316)]">Path</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={handleHomeClick}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--theme-navy,#0f172a)]"
              aria-label="Back to Home"
            >
              <span aria-hidden="true">←</span>
              <span>BACK to Home</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Body: Candidate authentication card neatly centered */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--theme-border,#e2e8f0)] bg-white shadow-xl">
          <div className="p-6 sm:p-8">{authForm}</div>
        </div>
      </main>

      <ForgotPasswordModal
        isOpen={showForgot}
        onClose={() => setShowForgot(false)}
        initialIdentifier={identifier}
        onComplete={() => {
          setMode("login");
          setStep("identifier");
          setPassword("");
          setError("Password reset successfully. Please sign in.");
        }}
      />
    </div>
  );
}

export { Auth };

