// Logged-out landing for ex-recruiters.
// Hooks into the `logged-out` CSS class declared in theme.css.

export default function LoggedOut({ onSignIn, onHome }) {
  return (
    <main className="logged-out min-h-screen text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-bold text-[var(--theme-navy)]">
          You're signed out
        </h1>
        <p className="mt-2 text-slate-600">
          Sign back in to keep posting jobs and reviewing applications.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onSignIn}
            className="rounded-xl bg-[var(--theme-orange)] px-5 py-3 text-sm font-bold text-white"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={onHome}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Back to home
          </button>
        </div>
      </div>
    </main>
  );
}
