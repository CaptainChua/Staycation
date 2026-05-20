"use client";

import { useEffect, useState } from "react";
import { User as UserIcon, Lock, Bell, Loader2, Check, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useChangeMyPasswordMutation,
} from "@/redux/api/partnerSelfApi";

const fontFraunces = "font-[var(--font-fraunces),Georgia,serif]";

const TABS = [
  { id: "profile" as const, label: "Profile", icon: UserIcon },
  { id: "notifications" as const, label: "Notifications", icon: Bell },
  { id: "security" as const, label: "Security", icon: Lock },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "security">("profile");

  return (
    <div className="animate-in fade-in duration-500">
      {/* PAGE HEADER */}
      <div className="mb-6">
        <div className="text-[11.5px] text-[#6B7280] uppercase tracking-[0.1em] mb-2 font-semibold">
          Account
        </div>
        <h1 className={`text-[32px] leading-[1.15] tracking-[-0.02em] text-[#111827] mb-1.5 font-medium ${fontFraunces}`}>
          Settings
        </h1>
        <p className="text-[14.5px] text-[#6B7280] max-w-[560px]">
          Manage your profile, notification preferences, and account security.
        </p>
      </div>

      {/* TAB BAR */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-1.5 mb-5 inline-flex gap-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold inline-flex items-center gap-2 transition ${
                isActive
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-[#374151] hover:bg-[#f9fafb]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      {activeTab === "profile" && <ProfileTab />}
      {activeTab === "notifications" && <NotificationsTab />}
      {activeTab === "security" && <SecurityTab />}
    </div>
  );
}

/* =========================================
   PROFILE TAB
========================================= */
function ProfileTab() {
  const { data: profile, isLoading } = useGetMyProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();

  const [form, setForm] = useState({
    fullname: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        fullname: profile.fullname || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        province: profile.province || "",
        postal_code: profile.postal_code || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile(form).unwrap();
      toast.success("Profile updated");
    } catch (err: unknown) {
      const message = (err as { data?: { error?: string } })?.data?.error || "Failed to update profile";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-14 text-center shadow-[0_1px_2px_rgba(15,42,46,0.04)]">
        <Loader2 className="w-7 h-7 text-brand-primary animate-spin mx-auto mb-3" />
        <p className="text-[#6B7280] text-sm">Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white border border-[#fecaca] rounded-[14px] p-8 text-center">
        <p className="text-[#dc2626] font-semibold">Couldn&apos;t load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Account info card (read-only) */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-6">
        <h3 className={`text-[17px] font-medium text-[#111827] mb-1 ${fontFraunces}`}>
          Account details
        </h3>
        <p className="text-[13px] text-[#6B7280] mb-5">
          These details are managed by Staycation Haven and can&apos;t be changed here.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyField label="Email" value={profile.email} />
          <ReadOnlyField
            label="Account status"
            value={profile.status?.toUpperCase() || "—"}
            valueClass={profile.status === "active" ? "text-emerald-600" : "text-amber-600"}
          />
          <ReadOnlyField
            label="Member since"
            value={new Date(profile.joined_at).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          />
          <ReadOnlyField
            label="Commission rate"
            value={`${Number(profile.commission_rate || 12).toFixed(0)}%`}
          />
        </div>
      </div>

      {/* Editable profile */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-6">
        <h3 className={`text-[17px] font-medium text-[#111827] mb-1 ${fontFraunces}`}>
          Personal information
        </h3>
        <p className="text-[13px] text-[#6B7280] mb-5">
          Keep your contact details up to date so guests and our team can reach you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Full name"
            value={form.fullname}
            onChange={(v) => setForm({ ...form, fullname: v })}
            placeholder="e.g. Maria Santos"
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v.replace(/\D/g, "").slice(0, 11) })}
            placeholder="09xxxxxxxxx"
            inputMode="numeric"
          />
          <Field
            label="Address"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            placeholder="Street, barangay"
            full
          />
          <Field
            label="City"
            value={form.city}
            onChange={(v) => setForm({ ...form, city: v })}
            placeholder="e.g. Quezon City"
          />
          <Field
            label="Province"
            value={form.province}
            onChange={(v) => setForm({ ...form, province: v })}
            placeholder="e.g. Metro Manila"
          />
          <Field
            label="Postal code"
            value={form.postal_code}
            onChange={(v) => setForm({ ...form, postal_code: v.replace(/\D/g, "").slice(0, 6) })}
            placeholder="e.g. 1100"
            inputMode="numeric"
          />
        </div>

        <div className="flex justify-end mt-6 pt-5 border-t border-[#e5e7eb]">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold text-sm inline-flex items-center gap-2 transition active:scale-95 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   NOTIFICATIONS TAB
========================================= */
function NotificationsTab() {
  // Persist these locally; backend column for email_prefs would slot in here later
  const [prefs, setPrefs] = useState(() => {
    if (typeof window === "undefined") {
      return { listingApprovals: true, newBookings: true, payoutAlerts: true, weeklyDigest: false, marketing: false };
    }
    try {
      const raw = localStorage.getItem("partner_notification_prefs");
      return raw ? JSON.parse(raw) : { listingApprovals: true, newBookings: true, payoutAlerts: true, weeklyDigest: false, marketing: false };
    } catch {
      return { listingApprovals: true, newBookings: true, payoutAlerts: true, weeklyDigest: false, marketing: false };
    }
  });

  const update = (key: keyof typeof prefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem("partner_notification_prefs", JSON.stringify(next));
    toast.success("Preference saved");
  };

  const items = [
    {
      key: "listingApprovals" as const,
      title: "Listing approvals",
      desc: "When your haven is approved, rejected, or needs revision.",
    },
    {
      key: "newBookings" as const,
      title: "New bookings",
      desc: "When a guest books one of your havens.",
    },
    {
      key: "payoutAlerts" as const,
      title: "Payout alerts",
      desc: "When a payout is scheduled, sent, or fails.",
    },
    {
      key: "weeklyDigest" as const,
      title: "Weekly performance digest",
      desc: "Summary of bookings, revenue, and reviews every Monday.",
    },
    {
      key: "marketing" as const,
      title: "Tips & marketing",
      desc: "Occasional emails with hosting tips and platform updates.",
    },
  ];

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-6">
      <h3 className={`text-[17px] font-medium text-[#111827] mb-1 ${fontFraunces}`}>
        Email notifications
      </h3>
      <p className="text-[13px] text-[#6B7280] mb-5">
        Choose what you want to hear about. Account-critical alerts are always sent regardless of preferences.
      </p>

      <div className="divide-y divide-[#e5e7eb]">
        {items.map((it) => (
          <label
            key={it.key}
            className="flex items-start justify-between gap-4 py-4 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#111827]">{it.title}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{it.desc}</p>
            </div>
            <Toggle checked={prefs[it.key]} onChange={(v) => update(it.key, v)} ariaLabel={it.title} />
          </label>
        ))}
      </div>

      <div className="mt-5 p-3 rounded-xl bg-[#FEF3C7] border border-[#DAA520]/30 text-[12px] text-[#92400e]">
        <strong>Note:</strong> Preferences are saved locally. A future update will sync them across devices.
      </div>
    </div>
  );
}

/* =========================================
   SECURITY TAB
========================================= */
function SecurityTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [changePassword, { isLoading }] = useChangeMyPasswordMutation();

  const handleSubmit = async () => {
    if (!current.trim()) {
      toast.error("Current password is required");
      return;
    }
    if (next.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (next !== confirm) {
      toast.error("New password and confirmation don't match");
      return;
    }

    try {
      await changePassword({ current_password: current, new_password: next }).unwrap();
      toast.success("Password updated");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err: unknown) {
      const message = (err as { data?: { error?: string } })?.data?.error || "Failed to change password";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-6">
        <h3 className={`text-[17px] font-medium text-[#111827] mb-1 ${fontFraunces}`}>
          Change password
        </h3>
        <p className="text-[13px] text-[#6B7280] mb-5">
          Use at least 8 characters. Mix upper, lower, numbers, and symbols for best security.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Current password"
            type="password"
            value={current}
            onChange={setCurrent}
            placeholder="Enter your current password"
            full
          />
          <Field
            label="New password"
            type="password"
            value={next}
            onChange={setNext}
            placeholder="At least 8 characters"
          />
          <Field
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Re-type new password"
          />
        </div>

        <div className="flex justify-end mt-6 pt-5 border-t border-[#e5e7eb]">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold text-sm inline-flex items-center gap-2 transition active:scale-95 disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Update password
          </button>
        </div>
      </div>

      <div className="bg-[#FEF3C7] border border-[#DAA520]/30 rounded-[14px] p-5 flex gap-3">
        <AlertCircle className="w-5 h-5 text-[#92400e] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-semibold text-[#92400e] mb-1">
            Account security tips
          </p>
          <ul className="text-[12.5px] text-[#374151] space-y-1 list-disc list-inside">
            <li>Never share your password with anyone — Staycation Haven will never ask for it.</li>
            <li>Use a unique password you don&apos;t use anywhere else.</li>
            <li>If you suspect your account is compromised, change your password and contact support immediately.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   Helpers
========================================= */
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  full?: boolean;
}

const Field = ({ label, value, onChange, placeholder, type = "text", inputMode, full }: FieldProps) => (
  <div className={full ? "sm:col-span-2" : ""}>
    <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">{label}</label>
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label}
      className="w-full px-3 py-2.5 border border-[#d1d5db] bg-white text-[#111827] rounded-[9px] outline-none focus:border-brand-primary focus:ring-[3px] focus:ring-brand-primary/15 transition text-[13.5px] placeholder:text-[#9CA3AF]"
    />
  </div>
);

const ReadOnlyField = ({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wide font-semibold text-[#6B7280] mb-1">{label}</p>
    <p className={`text-sm font-semibold text-[#111827] ${valueClass || ""}`}>{value}</p>
  </div>
);

const Toggle = ({ checked, onChange, ariaLabel }: { checked: boolean; onChange: (v: boolean) => void; ariaLabel: string }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    aria-label={ariaLabel}
    aria-pressed={checked}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition ${
      checked ? "bg-brand-primary" : "bg-[#d1d5db]"
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition mt-0.5 ${
        checked ? "translate-x-5" : "translate-x-0.5"
      }`}
    />
  </button>
);
