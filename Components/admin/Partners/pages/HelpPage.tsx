"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Plus, ImageIcon, Smile, Search, Loader2, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetMyMessageThreadsQuery,
  useSendPartnerMessageMutation,
} from "@/redux/api/partnerSelfApi";

const fontFraunces = "font-[var(--font-fraunces),Georgia,serif]";

interface Message {
  from: "me" | "them";
  name?: string;
  text: string;
  time: string;
}

const COLOR_MAP: Record<string, { bg: string; fg?: string }> = {
  primary: { bg: "bg-[#B8860B]" },
  gold: { bg: "bg-[#DAA520]", fg: "text-[#1f2937]" },
  green: { bg: "bg-[#16a34a]" },
  blue: { bg: "bg-[#2563eb]" },
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

const relTime = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

export default function HelpPage() {
  const { data: apiThreads = [], isLoading } = useGetMyMessageThreadsQuery();
  const [sendMessage, { isLoading: isSending }] = useSendPartnerMessageMutation();

  // Only real DB threads — no demo fallback.
  const threads = apiThreads.map((t) => {
    const color = COLOR_MAP[t.avatar_color || "primary"] || COLOR_MAP.primary;
    return {
      id: t.id,
      name: t.display_name,
      role: t.role_label || "",
      avatar: t.avatar_initials || "?",
      avatarBg: color.bg,
      avatarFg: color.fg,
      online: t.is_online,
      unread: t.unread_count,
      preview: t.last_message_preview || "",
      time: t.last_message_at ? relTime(t.last_message_at) : "",
      messages: (t.messages || []).map((m) => ({
        from: m.sender === "partner" ? "me" : "them",
        name: m.sender_name || undefined,
        text: m.body,
        time: formatTime(m.created_at),
      })) as Message[],
    };
  });

  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Empty-state composer (shown when partner has no threads yet).
  // Lets them start a conversation with a chosen team.
  const [emptyStateTarget, setEmptyStateTarget] = useState<string | null>(null);
  const [emptyStateBody, setEmptyStateBody] = useState("");

  useEffect(() => {
    if (!activeId && threads.length > 0) setActiveId(threads[0].id);
  }, [activeId, threads]);

  const active = threads.find((c) => c.id === activeId) || threads[0];
  const allMessages = active?.messages || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allMessages.length, activeId]);

  const send = async () => {
    const text = input.trim();
    if (!text || !active) return;
    setInput("");
    try {
      await sendMessage({ thread_id: active.id, body: text }).unwrap();
    } catch (err) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Failed to send message";
      toast.error(msg);
    }
  };

  const sendFirstMessage = async () => {
    const text = emptyStateBody.trim();
    if (!text || !emptyStateTarget) return;
    try {
      await sendMessage({ thread_key: emptyStateTarget, body: text }).unwrap();
      setEmptyStateBody("");
      setEmptyStateTarget(null);
      // RTK Query invalidates the Messages tag, so threads refetch automatically.
    } catch (err) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Failed to start conversation";
      toast.error(msg);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* PAGE HEADER */}
      <div className="mb-6">
        <div className="text-[11.5px] text-[#6B7280] uppercase tracking-[0.1em] mb-2 font-semibold">
          Help &amp; support
        </div>
        <h1 className={`text-[32px] leading-[1.15] tracking-[-0.02em] text-[#111827] mb-1.5 font-medium ${fontFraunces}`}>
          Chat with our team
        </h1>
        <p className="text-[14.5px] text-[#6B7280] max-w-[560px]">
          Reach support 24/7, talk to your account manager, or get help from finance and review teams.
        </p>
      </div>

      {/* EMPTY STATE — partner has no conversations yet */}
      {!isLoading && threads.length === 0 && (
        <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary grid place-items-center mx-auto mb-4">
            <MessageCircle className="w-7 h-7" />
          </div>
          <h2 className={`text-[22px] leading-[1.2] mb-2 text-[#111827] font-medium ${fontFraunces}`}>
            No conversations yet
          </h2>
          <p className="text-[14px] text-[#6B7280] mb-6 max-w-[480px] mx-auto">
            Start a chat with the team that fits your question. We&apos;ll reply as soon as we can — Support is available 24/7.
          </p>
          {!emptyStateTarget ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[560px] mx-auto">
              <button
                type="button"
                onClick={() => setEmptyStateTarget("support")}
                className="px-4 py-3 rounded-[10px] border border-[#e5e7eb] hover:border-[#B8860B] hover:bg-[#FEF3C7]/40 transition text-left"
              >
                <div className="text-[13.5px] font-semibold text-[#111827]">Staycation Haven Support</div>
                <div className="text-[11.5px] text-[#6B7280]">Customer service · 24/7</div>
              </button>
              <button
                type="button"
                onClick={() => setEmptyStateTarget("manager")}
                className="px-4 py-3 rounded-[10px] border border-[#e5e7eb] hover:border-[#B8860B] hover:bg-[#FEF3C7]/40 transition text-left"
              >
                <div className="text-[13.5px] font-semibold text-[#111827]">Account Manager</div>
                <div className="text-[11.5px] text-[#6B7280]">Your account manager</div>
              </button>
              <button
                type="button"
                onClick={() => setEmptyStateTarget("billing")}
                className="px-4 py-3 rounded-[10px] border border-[#e5e7eb] hover:border-[#B8860B] hover:bg-[#FEF3C7]/40 transition text-left"
              >
                <div className="text-[13.5px] font-semibold text-[#111827]">Payouts &amp; Billing</div>
                <div className="text-[11.5px] text-[#6B7280]">Finance team</div>
              </button>
              <button
                type="button"
                onClick={() => setEmptyStateTarget("verify")}
                className="px-4 py-3 rounded-[10px] border border-[#e5e7eb] hover:border-[#B8860B] hover:bg-[#FEF3C7]/40 transition text-left"
              >
                <div className="text-[13.5px] font-semibold text-[#111827]">Listing Review Team</div>
                <div className="text-[11.5px] text-[#6B7280]">Approvals · Mon–Sat</div>
              </button>
            </div>
          ) : (
            <div className="max-w-[560px] mx-auto text-left">
              <div className="text-[12.5px] text-[#6B7280] mb-2">
                Starting a new conversation with{" "}
                <strong className="text-[#111827]">
                  {emptyStateTarget === "support" && "Staycation Haven Support"}
                  {emptyStateTarget === "manager" && "Account Manager"}
                  {emptyStateTarget === "billing" && "Payouts & Billing"}
                  {emptyStateTarget === "verify" && "Listing Review Team"}
                </strong>
              </div>
              <textarea
                value={emptyStateBody}
                onChange={(e) => setEmptyStateBody(e.target.value)}
                placeholder="What can we help you with?"
                aria-label="Your message"
                rows={4}
                className="w-full bg-white border border-[#e5e7eb] rounded-[10px] px-4 py-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B8860B] focus:ring-[3px] focus:ring-[#B8860B]/15 resize-none placeholder:text-[#9CA3AF]"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => { setEmptyStateTarget(null); setEmptyStateBody(""); }}
                  disabled={isSending}
                  className="px-4 py-2 rounded-[9px] border border-[#e5e7eb] text-[12.5px] font-semibold text-[#374151] hover:bg-[#f9fafb] transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={sendFirstMessage}
                  disabled={isSending || !emptyStateBody.trim()}
                  className="px-4 py-2 rounded-[9px] bg-[#B8860B] hover:bg-[#8B6508] text-white text-[12.5px] font-semibold inline-flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send message
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading && (
        <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-14 text-center">
          <Loader2 className="w-6 h-6 text-[#B8860B] animate-spin mx-auto" />
        </div>
      )}

      {/* CHAT — only when partner has at least one real thread */}
      {!isLoading && threads.length > 0 && (
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] overflow-hidden grid grid-cols-1 md:grid-cols-[300px_1fr] h-[640px]">
        {/* LEFT SIDEBAR */}
        <aside className="border-r border-[#e5e7eb] bg-[#f9fafb] flex flex-col">
          <div className="p-3.5 border-b border-[#e5e7eb]">
            <div className="flex items-center gap-2 bg-white border border-[#e5e7eb] rounded-[9px] px-3 py-1.5 text-[#6B7280]">
              <Search className="w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search conversations…"
                aria-label="Search conversations"
                className="bg-transparent border-none outline-none flex-1 text-[12.5px] text-[#111827] placeholder:text-[#9CA3AF]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="p-6 text-center">
                <Loader2 className="w-5 h-5 text-[#B8860B] animate-spin mx-auto" />
              </div>
            )}
            {threads.map((c) => {
              const isActive = activeId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left px-3.5 py-3 flex items-start gap-3 border-b border-[#e5e7eb] transition ${
                    isActive ? "bg-white" : "hover:bg-white/60"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full ${c.avatarBg} ${c.avatarFg || "text-white"} grid place-items-center font-semibold text-[14px]`}
                    >
                      {c.avatar}
                    </div>
                    {c.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#16a34a] border-2 border-[#f9fafb]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-[13.5px] font-semibold text-[#111827] truncate">
                        {c.name}
                      </span>
                      <span className="text-[11px] text-[#6B7280] flex-shrink-0">{c.time}</span>
                    </div>
                    <div className="text-[11.5px] text-[#6B7280] mb-1">{c.role}</div>
                    <div className="flex justify-between items-center gap-2">
                      <p className="text-[12px] text-[#374151] truncate">{c.preview}</p>
                      {c.unread > 0 && (
                        <span className="text-[10.5px] font-bold text-white bg-[#B8860B] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT CHAT WINDOW */}
        <div className="flex flex-col min-w-0">
          {/* Chat header */}
          <header className="px-5 py-4 border-b border-[#e5e7eb] flex items-center gap-3 flex-shrink-0">
            <div
              className={`w-10 h-10 rounded-full ${active.avatarBg} ${active.avatarFg || "text-white"} grid place-items-center font-semibold text-[14px]`}
            >
              {active.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[15px] font-semibold text-[#111827] ${fontFraunces}`}>
                {active.name}
              </div>
              <div className="text-[11.5px] text-[#6B7280] flex items-center gap-1.5">
                {active.online && <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />}
                {active.online ? "Online" : "Offline"} · {active.role}
              </div>
            </div>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#f9fafb]">
            {allMessages.map((m, i) => {
              const mine = m.from === "me";
              return (
                <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                    {!mine && m.name && (
                      <span className="text-[10.5px] text-[#6B7280] mb-1 px-1">{m.name}</span>
                    )}
                    <div
                      className={`px-4 py-2.5 text-[13.5px] leading-relaxed break-words shadow-sm ${
                        mine
                          ? "bg-[#B8860B] text-white rounded-[18px] rounded-br-[6px]"
                          : "bg-white border border-[#e5e7eb] text-[#111827] rounded-[18px] rounded-bl-[6px]"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className={`text-[10.5px] text-[#6B7280] mt-1 px-1 ${mine ? "text-right" : "text-left"}`}>
                      {m.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-[#e5e7eb] bg-white flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              title="Attach file"
              aria-label="Attach file"
              className="w-9 h-9 rounded-[9px] grid place-items-center text-[#6B7280] hover:bg-[#f9fafb] transition"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Attach image"
              aria-label="Attach image"
              className="w-9 h-9 rounded-[9px] grid place-items-center text-[#6B7280] hover:bg-[#f9fafb] transition"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Type a message…"
              aria-label="Message"
              className="flex-1 bg-[#f9fafb] border border-[#e5e7eb] rounded-full px-4 py-2.5 text-[13.5px] text-[#111827] outline-none focus:border-[#B8860B] focus:ring-[3px] focus:ring-[#B8860B]/15 resize-none placeholder:text-[#9CA3AF] min-h-[40px] max-h-[120px]"
            />
            <button
              type="button"
              title="Emoji"
              aria-label="Emoji"
              className="w-9 h-9 rounded-[9px] grid place-items-center text-[#6B7280] hover:bg-[#f9fafb] transition"
            >
              <Smile className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={send}
              title="Send"
              aria-label="Send"
              className="w-9 h-9 rounded-[9px] grid place-items-center bg-[#B8860B] hover:bg-[#8B6508] text-white transition active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
