import { useState } from "react";
import { api, formatAccountError } from "../api.js";

/** Shared irreversible account-deletion control for candidate and recruiter profiles. */
export default function DangerZone({ role, onDeleted }) {
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const isConfirmed = confirmation === "DELETE";
  const roleLabel = role === "recruiter" ? "job postings and their linked applications" : "submitted applications";

  async function deleteAccount() {
    if (!isConfirmed || deleting) return;
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;

    setDeleting(true);
    setError("");
    try {
      await api.deleteAccount();
      onDeleted?.();
    } catch (err) {
      setError(formatAccountError(err, "Could not delete your account. Please try again."));
      setDeleting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-red-900">Danger zone</h2>
      <p className="mt-2 text-sm text-red-800">
        Deleting your account is permanent. This removes your profile and associated {roleLabel}.
      </p>
      <label className="mt-5 block">
        <span className="text-xs font-bold uppercase tracking-wide text-red-800">Type DELETE to confirm</span>
        <input
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="DELETE"
          autoComplete="off"
          className="mt-1 block w-full max-w-sm rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200"
        />
      </label>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
      <button
        type="button"
        onClick={deleteAccount}
        disabled={!isConfirmed || deleting}
        className="mt-5 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? "Deleting account..." : "Delete account permanently"}
      </button>
    </section>
  );
}
