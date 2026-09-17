// ChatDialog — AI support chatbot for MyCareerPath.
//
// Talks to the backend's POST /api/chatbot/chat endpoint via
// `api.chat({ message, history })`. The backend feeds `history` into
// the Gemini call as a multi-turn context, so the same dialog keeps
// conversational memory across turns (and across opens, as long as the
// component is mounted — see App.jsx for how the parent keeps the
// component alive while the toggle button hides it).
//
// Props:
//   - isOpen:   controls the dialog's visibility. When false, the
//               dialog is hidden but state is retained so reopening
//               shows the prior conversation.
//   - onClose:  callback to dismiss the dialog. Called on the X button,
//               the Esc key, and on a backdrop click.
//   - userRole: optional role label rendered in the welcome banner.

import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";

const WELCOME =
  "Hi! I'm the MyCareerPath assistant. Ask me about navigating the site, " +
  "finding jobs, or improving your profile.";

export default function ChatDialog({ isOpen, onClose, userRole }) {
  // Conversation state. Each entry is { role: "user" | "model", content }.
  // Initialised with a single model "welcome" turn so the dialog never
  // shows up empty.
  const [messages, setMessages] = useState(() => [
    { role: "model", content: WELCOME },
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll the message list to the bottom whenever it grows.
  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isOpen]);

  // Focus the input when the dialog opens so the user can start typing.
  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  // Esc closes the dialog. Bound only while open.
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  async function handleSend(e) {
    if (e) e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setError("");
    // Optimistically append the user turn so the UI feels instant.
    const userTurn = { role: "user", content: text };
    const nextHistory = [...messages, userTurn];
    setMessages(nextHistory);
    setDraft("");
    setSending(true);

    try {
      // The backend appends the current user message itself, so we
      // send only the *prior* history.
      const historyForBackend = nextHistory
        .filter((m) => m !== userTurn)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await api.chat({ message: text, history: historyForBackend });
      const reply = res?.reply?.trim() || "I didn't catch that — could you rephrase?";
      setMessages((prev) => [...prev, { role: "model", content: reply }]);
    } catch (err) {
      // Keep the user turn in the transcript so the conversation
      // makes sense on retry, but surface the failure inline.
      setError(err?.message || "Chatbot is unavailable right now.");
    } finally {
      setSending(false);
      // Re-focus the input so the user can follow up.
      inputRef.current?.focus();
    }
  }

  function handleClear() {
    setMessages([{ role: "model", content: WELCOME }]);
    setError("");
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="MyCareerPath AI assistant"
      // Backdrop. Stop propagation on the inner panel so a click inside
      // the dialog doesn't dismiss it.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      className="fixed inset-0 z-50 flex items-end justify-end bg-black/30 px-4 py-6 sm:items-center sm:justify-end"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-[min(80vh,640px)] min-h-0 w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-[var(--theme-border)]"
      >
        <header className="flex items-center justify-between gap-2 border-b border-[var(--theme-border)] bg-[var(--theme-navy)] px-4 py-3 text-white">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold">
              MyCareerPath Assistant
            </h2>
            <p className="truncate text-xs text-white/70">
              {userRole ? `Signed in as ${userRole}` : "AI support · always on"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/10"
              aria-label="Clear conversation"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-white/80 hover:bg-white/10"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto overscroll-contain bg-[var(--theme-cream)] px-4 py-4"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm ${
                  m.role === "user"
                    ? "bg-[var(--theme-orange)] text-white"
                    : "bg-white text-slate-800 ring-1 ring-[var(--theme-border)]"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-white px-3 py-2 text-sm text-slate-500 ring-1 ring-[var(--theme-border)]">
                <span aria-label="Assistant is thinking" className="inline-flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.15s" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.3s" }}>.</span>
                </span>
              </div>
            </div>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200" role="alert">
              {error}
            </p>
          )}
        </div>

        <form
          onSubmit={handleSend}
          className="border-t border-[var(--theme-border)] bg-white px-3 py-3"
        >
          <div className="flex items-end gap-2">
            <label className="sr-only" htmlFor="chat-input">
              Message
            </label>
            <textarea
              id="chat-input"
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Enter to send, Shift+Enter for newline.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me anything..."
              rows={1}
              disabled={sending}
              className="min-h-[40px] max-h-32 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--theme-orange)] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="rounded-lg bg-[var(--theme-orange)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Press <kbd className="rounded bg-slate-100 px-1 font-mono">Enter</kbd> to send,
            <kbd className="ml-1 rounded bg-slate-100 px-1 font-mono">Shift+Enter</kbd> for newline,
            <kbd className="ml-1 rounded bg-slate-100 px-1 font-mono">Esc</kbd> to close.
          </p>
        </form>
      </div>
    </div>
  );
}
