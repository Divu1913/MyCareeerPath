import React from "react";

export default function Navbar({
  user,
  onLogin,
  onRegister,
  onRecruiters,
  onDashboard,
  onProfile,
  onSettings,
  onLogout,
  subtitle,
}) {
  return (
    <header className="w-full border-b border-[var(--theme-border)] bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img
            src="/assets/logo.png"
            alt="MyCareerPath Logo"
            className="h-10 w-auto rounded-lg object-contain"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold tracking-tight text-[var(--theme-navy)]">
                MyCareer<span className="text-[var(--theme-orange)]">Path</span>
              </span>
              {subtitle && (
                <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
                  {subtitle}
                </span>
              )}
            </div>
            <p className="hidden text-[11px] font-medium text-slate-500 sm:block">
              Local Opportunities, Brighter Tomorrows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <button
              type="button"
              onClick={onDashboard}
              className="rounded-xl bg-[var(--theme-navy)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Dashboard
            </button>
          ) : (
            <>
              {onLogin && (
                <button
                  type="button"
                  onClick={onLogin}
                  className="rounded-lg border border-[var(--theme-navy)] px-4 py-1.5 text-sm font-semibold text-[var(--theme-navy)] hover:bg-slate-50"
                >
                  Sign In
                </button>
              )}
              {onRegister && (
                <button
                  type="button"
                  onClick={onRegister}
                  className="rounded-lg bg-[var(--theme-orange)] px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                >
                  Register
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

