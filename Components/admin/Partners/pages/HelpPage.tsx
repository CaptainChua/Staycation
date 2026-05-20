"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Plus, ImageIcon, Smile, Search, Loader2 } from "lucide-react";
import {
  useGetMyMessageThreadsQuery,
  useSendPartnerMessageMutation,
} from "@/redux/api/partnerSelfApi";

const fontFraunces = "font-[var(--font-fraunces),Georgia,serif]";

interface Conversation {
  id: string;
  name: string;
  role: string;
  avatar: string;
  avatarBg: string;
  avatarFg?: string;
  online: boolean;
  unread: number;
  preview: string;
  time: string;
}

const CONVERSATIONS: Conversation[] = [
  {
    id: "support",
    name: "Staycation Haven Support",
    role: "Customer service · 24/7",
    avatar: "S",
    avatarBg: "bg-[#B8860B]",
    online: true,
    unread: 1,
    preview: "Got it — we'll have an answer for you within the hour.",
    time: "2m",
  },
  {
    id: "manager",
    name: "Aileen Ramos",
    role: "Your account manager",
    avatar: "AR",
    avatarBg: "bg-[#DAA520]",
    avatarFg: "text-[#1f2937]",
    online: true,
    unread: 0,
    preview: "Let me know once you've resubmitted the Bamboo Cottage edits.",
    time: "3h",
  },
  {
    id: "billing",
    name: "Payouts & Billing",
    role: "Finance team",
    avatar: "₱",
    avatarBg: "bg-[#16a34a]",
    online: false,
    unread: 0,
    preview: "Your May 15 payout of ₱42,180 was sent to GCash ending 4421.",
    time: "Yesterday",
  },
  {
    id: "verify",
    name: "Listing Review Team",
    role: "Approvals · Mon–Sat",
    avatar: "LR",
    avatarBg: "bg-[#2563eb]",
    online: false,
    unread: 0,
    preview: "Sunrise Studio needs revision — see notes in the listing.",
    time: "2d",
  },
];

interface Message {
  from: "me" | "them";
  name?: string;
  text: string;
  time: string;
}

const THREADS: Record<string, Message[]> = {
  support: [
    {
      from: "them",
      name: "Maya · Support",
      text: "Hi Maria! Thanks for reaching out — how can we help with Casa Verde Tagaytay today?",
      time: "1:14 PM",
    },
    {
      from: "me",
      text: "Hi! A guest at Hilltop Deluxe Suite asked about late check-out. Can I offer it case-by-case, or do I need to update my house rules?",
      time: "1:18 PM",
    },
    {
      from: "them",
      name: "Maya · Support",
      text: "Totally fine to offer it case-by-case 👍 We don't require changes to house rules unless you're making it a standing offer. If it's standing, I'd recommend updating so guests see it before booking.",
      time: "1:22 PM",
    },
    { from: "me", text: "Got it. One more — is there a fee for offering early check-in?", time: "1:24 PM" },
    {
      from: "them",
      name: "Maya · Support",
      text: "Got it — we'll have an answer for you within the hour. Pulling up the policy now.",
      time: "1:31 PM",
    },
  ],
  manager: [
    {
      from: "them",
      name: "Aileen Ramos",
      text: "Hey Maria — just a heads up, Bamboo Cottage is doing really well this month. Have you thought about adding a weekend premium?",
      time: "Tue 11:02 AM",
    },
    { from: "me", text: "I've been thinking about it — what's a reasonable bump?", time: "Tue 4:18 PM" },
    {
      from: "them",
      name: "Aileen Ramos",
      text: "For your area, 15–20% Fri/Sat is the sweet spot. Most of our top hosts in Tagaytay are doing 18%. Let me know once you've resubmitted the Bamboo Cottage edits.",
      time: "Tue 4:24 PM",
    },
  ],
  billing: [
    {
      from: "them",
      name: "Payouts · Auto",
      text: "Your May 15 payout of ₱42,180 was sent to GCash ending 4421. It should arrive within 1 business day.",
      time: "May 15",
    },
  ],
  verify: [
    {
      from: "them",
      name: "Review Team",
      text: "Sunrise Studio needs revision — please re-upload sharper photos (min 1600px wide) and confirm WiFi, AC, and parking before resubmitting.",
      time: "May 17",
    },
  ],
};

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
  const [sendMessage] = useSendPartnerMessageMutation();

  const threads = apiThreads.length > 0
    ? apiThreads.map((t) => {
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
      })
    : CONVERSATIONS.map((c) => ({ ...c, messages: THREADS[c.id] || [] }));

  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

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

    // If real thread (UUID), call API; else just optimistic local update
    if (apiThreads.length > 0) {
      try {
        await sendMessage({ thread_id: active.id, body: text }).unwrap();
      } catch {
        // ignore — toast handled at app level
      }
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

      {/* CHAT */}
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
    </div>
  );
}
