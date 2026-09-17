import { useEffect, useRef, useState } from "react";

function getInitials(user) {
  const value = user?.full_name || user?.email || user?.phone || "?";
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

/** Shared account menu used by candidate and recruiter dashboard headers. */
export default function ProfileDropdown({ user, onProfile, onDashboard, onSettings, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const name = user?.full_name || "MyCareerPath user";
  const headline = user?.headline || user?.role || "Member";

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  function choose(callback) {
    setIsOpen(false);
    callback?.();
  }

  const avatarUrl = user?.profile_photo_url || user?.avatar_url;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--theme-orange)] text-sm font-bold text-white shadow-sm ring-2 ring-white/30 transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--theme-orange)] focus:ring-offset-2"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          getInitials(user)
        )}
      </button>

      {isOpen && (
        <div role="menu" aria-label="Profile menu" className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
            <p className="mt-0.5 truncate text-xs capitalize text-slate-500">{headline}</p>
            {user?.email && <p className="mt-2 truncate text-xs text-slate-600">{user.email}</p>}
            {user?.phone && <p className="mt-0.5 truncate text-xs text-slate-600">{user.phone}</p>}
          </div>
          <div className="p-1.5">
            <MenuItem onClick={() => choose(onProfile)}>My Profile</MenuItem>
            <MenuItem onClick={() => choose(onDashboard)}>Dashboard</MenuItem>
            <MenuItem onClick={() => choose(onSettings)}>Settings</MenuItem>
            <div className="my-1 border-t border-slate-100" />
            <MenuItem danger onClick={() => choose(onLogout)}>Sign out</MenuItem>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, danger = false, onClick }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${danger ? "text-red-700 hover:bg-red-50" : "text-slate-700 hover:bg-slate-100"}`}
    >
      {children}
    </button>
  );
}
