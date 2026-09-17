import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const root = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => api.getNotifications().then((data) => { if (!cancelled) { setItems(data?.items || []); setUnread(data?.unread_count || 0); } }).catch(() => {});
    load();
    const timer = window.setInterval(load, 60000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  async function markRead(notification) {
    if (notification.read) return;
    try {
      await api.markNotificationRead(notification.id);
      setItems((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
      setUnread((current) => Math.max(0, current - 1));
    } catch { /* The notification remains unread if the request failed. */ }
  }

  return <div ref={root} className="relative"><button type="button" onClick={() => setOpen((value) => !value)} aria-label="Notifications" aria-expanded={open} className="relative rounded-full p-2 text-slate-200 transition hover:bg-slate-800 hover:text-white"><Bell className="h-5 w-5" />{unread > 0 && <span className="absolute right-0 top-0 min-w-4 rounded-full bg-[var(--theme-orange)] px-1 text-center text-[10px] font-black leading-4 text-white">{unread > 9 ? "9+" : unread}</span>}</button>{open && <section className="absolute right-0 z-50 mt-2 w-[min(92vw,360px)] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-xl" aria-label="Notifications"><div className="border-b border-slate-100 px-4 py-3"><h2 className="font-bold">Notifications</h2></div>{items.length ? <div className="max-h-96 overflow-y-auto">{items.map((item) => <button key={item.id} type="button" onClick={() => markRead(item)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${item.read ? "" : "bg-orange-50/60"}`}><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{item.message}</p><p className="mt-1 text-[11px] text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleString() : "Just now"}{item.read ? "" : " · Mark as read"}</p></button>)}</div> : <p className="p-5 text-center text-sm text-slate-500">No notifications yet.</p>}</section>}</div>;
}
