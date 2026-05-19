"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  Plus,
  List,
  BarChart3,
  Receipt,
  Settings,
  MessageCircle,
  LogOut,
  Search,
  Bell,
  MessageSquare,
} from "lucide-react";
import PartnersDashboard from "./PartnersDashboard";
import MyListingsPage from "./pages/MyListingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CostBreakdownPage from "./pages/CostBreakdownPage";
import AddRoomPage from "./pages/AddRoomPage";
import HelpPage from "./pages/HelpPage";
import SettingsPage from "./pages/SettingsPage";

const NAV_TOP = [
  { id: "dashboard", icon: Home, label: "Dashboard" },
  { id: "add", icon: Plus, label: "Add room" },
  { id: "listings", icon: List, label: "My listings" },
  { id: "analytics", icon: BarChart3, label: "Analytics" },
  { id: "cost", icon: Receipt, label: "Cost breakdown" },
];

const NAV_BOTTOM = [
  { id: "settings", icon: Settings, label: "Settings" },
  { id: "help", icon: MessageCircle, label: "Help & support" },
];

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  add: "Add room",
  listings: "My listings",
  analytics: "Analytics",
  cost: "Cost breakdown",
  settings: "Settings",
  help: "Help & support",
};

const fontFraunces = "font-[var(--font-fraunces),Georgia,serif]";

export default function PartnerShell(_props: { children?: React.ReactNode }) {
  const { data: session } = useSession();
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <PartnersDashboard onNavigate={setActivePage} />;
      case "add":
        return <AddRoomPage onNavigate={setActivePage} />;
      case "listings":
        return <MyListingsPage onNavigate={setActivePage} />;
      case "analytics":
        return <AnalyticsPage onNavigate={setActivePage} />;
      case "cost":
        return <CostBreakdownPage onNavigate={setActivePage} />;
      case "settings":
        return <SettingsPage />;
      case "help":
        return <HelpPage />;
      default:
        return <PartnersDashboard />;
    }
  };

  const partnerName = (session?.user?.name as string) || "Partner";
  const initials =
    partnerName
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "P";

  return (
    <div className="grid grid-cols-1 md:grid-cols-[248px_1fr] min-h-screen bg-[#f9fafb] text-[#111827]">
      {/* SIDEBAR */}
      <aside className="bg-white border-r border-[#e5e7eb] flex flex-col md:sticky md:top-0 md:h-screen">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#e5e7eb]">
          <div
            className={`w-9 h-9 rounded-[10px] grid place-items-center text-white font-semibold text-lg shadow-sm bg-gradient-to-br from-[#B8860B] to-[#1f2937] ${fontFraunces}`}
          >
            S
          </div>
          <div>
            <div className={`text-[15px] leading-tight text-[#111827] font-medium ${fontFraunces}`}>
              Staycation Haven
            </div>
            <div className="text-[10.5px] text-[#6B7280] uppercase tracking-[0.06em] mt-0.5">
              Partner · PH
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-3 py-3.5 flex-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[#9CA3AF] px-2.5 pt-3.5 pb-2 font-semibold">
            Workspace
          </div>
          {NAV_TOP.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-[9px] text-[13.5px] transition text-left mb-0.5 ${
                  isActive
                    ? "bg-[#FEF3C7] text-[#B8860B] font-semibold"
                    : "text-[#374151] font-medium hover:bg-[#f9fafb]"
                }`}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {item.label}
              </button>
            );
          })}

          <div className="text-[10px] uppercase tracking-[0.12em] text-[#9CA3AF] px-2.5 pt-3.5 pb-2 font-semibold">
            Account
          </div>
          {NAV_BOTTOM.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-[9px] text-[13.5px] transition text-left mb-0.5 ${
                  isActive
                    ? "bg-[#FEF3C7] text-[#B8860B] font-semibold"
                    : "text-[#374151] font-medium hover:bg-[#f9fafb]"
                }`}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {item.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-[9px] text-[13.5px] text-[#6B7280] font-medium hover:bg-[#f9fafb] transition text-left mt-1"
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            Log out
          </button>
        </nav>

        {/* Profile */}
        <div className="px-3.5 py-3.5 border-t border-[#e5e7eb] flex items-center gap-3">
          <div className="w-[38px] h-[38px] rounded-full grid place-items-center text-[#1f2937] font-semibold text-sm flex-shrink-0 bg-[#DAA520]">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-semibold text-[#111827] leading-tight truncate">
              {partnerName}
            </div>
            <div className="text-[10.5px] text-[#6B7280] flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DAA520]" />
              Standard Partner
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex flex-col min-w-0">
        {/* TOPBAR */}
        <header className="sticky top-0 z-10 bg-[#f9fafb]/80 backdrop-blur border-b border-[#e5e7eb] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="text-[11px] uppercase tracking-[0.1em] text-[#6B7280] font-semibold whitespace-nowrap">
              Partner Portal
            </span>
            <span className="text-[#9CA3AF]">/</span>
            <span className="text-[14px] font-semibold text-[#111827] truncate">
              {PAGE_TITLES[activePage]}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-white border border-[#e5e7eb] rounded-[9px] px-3 py-1.5 w-[320px] text-[#6B7280]">
            <Search className="w-4 h-4" />
            <input
              type="text"
              placeholder="Search rooms, bookings, guests…"
              aria-label="Search"
              className="bg-transparent border-none outline-none flex-1 text-[13px] text-[#111827] placeholder:text-[#9CA3AF]"
            />
            <span className="text-[11px] text-[#9CA3AF] font-mono px-1.5 py-0.5 border border-[#e5e7eb] rounded">
              ⌘K
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Messages"
              aria-label="Messages"
              className="w-9 h-9 rounded-[9px] bg-white border border-[#e5e7eb] grid place-items-center text-[#374151] hover:bg-[#f3f4f6] transition"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Notifications"
              aria-label="Notifications"
              className="relative w-9 h-9 rounded-[9px] bg-white border border-[#e5e7eb] grid place-items-center text-[#374151] hover:bg-[#f3f4f6] transition"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-[7px] h-[7px] rounded-full bg-[#dc2626] border-2 border-white" />
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="max-w-[1400px] w-full px-4 md:px-8 pt-7 pb-14">{renderPage()}</main>
      </div>
    </div>
  );
}
