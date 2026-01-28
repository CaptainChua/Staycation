"use client";

import {
  Bell,
  ShieldCheck,
  Palette,
  Info,
  Smartphone,
  Mail,
  AlertTriangle,
  Fingerprint,
  Wifi,
  Lock,
  Calendar,
  DollarSign,
  FileText,
  Users,
  Package,
  MessageSquare,
  Clock,
  CheckCircle,
  Settings as SettingsIcon,
  Printer,
  Download,
  Upload,
  CreditCard,
  Hotel,
  UserCheck,
  ClipboardList
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const primaryBtn =
  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  // CSR Front Desk Specific Settings
  const [bookingSettings, setBookingSettings] = useState({
    autoConfirmBookings: false,
    requireDepositForBooking: true,
    sendCheckInReminders: true,
    sendCheckOutReminders: true,
    allowSameDayBooking: true,
    maxGuestsPerRoom: 4,
  });

  const [paymentSettings, setPaymentSettings] = useState({
    acceptGCash: true,
    acceptBankTransfer: true,
    acceptCash: true,
    requireFullPayment: false,
    autoProcessRefunds: false,
    paymentReminderEnabled: true,
  });

  const [deliverableSettings, setDeliverableSettings] = useState({
    autoConfirmDeliverables: false,
    requirePaymentForDeliverables: true,
    sendDeliveryUpdates: true,
    allowGuestCancellation: true,
    defaultDeliveryTime: "09:00",
  });

  const [cleanerSettings, setCleanerSettings] = useState({
    autoAssignCleaners: false,
    requireCleanerConfirmation: true,
    sendCleaningReminders: true,
    allowCleanerNotes: true,
    cleaningTimeBuffer: 2, // hours
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    newBookings: true,
    paymentConfirmations: true,
    checkInNotifications: true,
    checkOutNotifications: true,
    cleaningUpdates: true,
    deliverableUpdates: true,
    guestMessages: true,
    systemAlerts: true,
  });

  const [appearance, setAppearance] = useState({
    theme: theme || "light",
    density: "comfortable",
    language: "en",
    timezone: "GMT+08",
    autoRefreshDashboard: true,
    showQuickActions: true,
  });

  // Sync theme with appearance state using requestAnimationFrame to avoid cascading renders
  useEffect(() => {
    if (theme && theme !== appearance.theme) {
      // Schedule the state update for the next animation frame
      const rafId = requestAnimationFrame(() => {
        setAppearance((prev) => ({ ...prev, theme }));
      });
      
      return () => cancelAnimationFrame(rafId);
    }
  }, [theme, appearance.theme]);

  const toggleBookingSetting = (key: keyof typeof bookingSettings) => {
    setBookingSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePaymentSetting = (key: keyof typeof paymentSettings) => {
    setPaymentSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDeliverableSetting = (key: keyof typeof deliverableSettings) => {
    setDeliverableSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCleanerSetting = (key: keyof typeof cleanerSettings) => {
    setCleanerSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleNotification = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAppearanceChange = (
    field: keyof typeof appearance,
    value: string | boolean
  ) => {
    setAppearance((prev) => ({ ...prev, [field]: value }));
    if (field === "theme") {
      setTheme(value as string);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
          CSR Front Desk
        </p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
          Configure your CSR front desk operations, booking workflows, payment processing, and notification preferences.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            icon: <Bell className="w-5 h-5 text-brand-primary" />,
            label: "Active notifications",
            value: Object.values(notificationPrefs).filter(Boolean).length,
            total: Object.keys(notificationPrefs).length,
            accent: "bg-brand-primaryLighter text-brand-primary",
          },
          {
            icon: <Calendar className="w-5 h-5 text-green-600" />,
            label: "Booking workflows",
            value: Object.values(bookingSettings).filter(Boolean).length,
            total: Object.keys(bookingSettings).length,
            accent: "bg-green-50 text-green-700",
          },
          {
            icon: <DollarSign className="w-5 h-5 text-purple-600" />,
            label: "Payment methods",
            value: Object.values(paymentSettings).filter((v, i) => i < 3).filter(Boolean).length,
            total: 3,
            accent: "bg-purple-50 text-purple-700",
          },
          {
            icon: <Palette className="w-5 h-5 text-indigo-600" />,
            label: "Theme",
            value:
              appearance.theme === "system"
                ? "Match System"
                : appearance.theme === "dark"
                ? "Dark"
                : "Light",
            total: "",
            accent: "bg-indigo-50 text-indigo-700",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm"
          >
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${card.accent}`}
            >
              {card.icon}
              {card.label}
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {card.value}
              {card.total ? (
                <span className="text-base font-medium text-gray-400">
                  /{card.total}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Last updated a few seconds ago
            </p>
          </div>
        ))}
      </div>

      {/* Notification Preferences */}
      <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-gray-800 px-6 py-5">
          <div className="flex items-center gap-2 text-brand-primary">
            <Bell className="w-4 h-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em]">
              Alerts & notifications
            </p>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Notification preferences
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose when CSR admins are notified of booking activity, payouts, or
            internal announcements.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {[
            {
              id: "newBookings" as const,
              title: "New bookings",
              description: "Alert when new bookings are received.",
              icon: <Calendar className="w-4 h-4 text-brand-primary" />,
            },
            {
              id: "paymentConfirmations" as const,
              title: "Payment confirmations",
              description: "Notify when payments are confirmed.",
              icon: <DollarSign className="w-4 h-4 text-brand-primary" />,
            },
            {
              id: "checkInNotifications" as const,
              title: "Check-in notifications",
              description: "Guest arrival and check-in alerts.",
              icon: <UserCheck className="w-4 h-4 text-brand-primary" />,
            },
            {
              id: "checkOutNotifications" as const,
              title: "Check-out notifications",
              description: "Guest departure and room cleaning alerts.",
              icon: <Hotel className="w-4 h-4 text-brand-primary" />,
            },
            {
              id: "cleaningUpdates" as const,
              title: "Cleaning updates",
              description: "Housekeeping status changes.",
              icon: <Users className="w-4 h-4 text-brand-primary" />,
            },
            {
              id: "deliverableUpdates" as const,
              title: "Deliverable updates",
              description: "Add-on service status notifications.",
              icon: <FileText className="w-4 h-4 text-brand-primary" />,
            },
            {
              id: "guestMessages" as const,
              title: "Guest messages",
              description: "New messages from guests.",
              icon: <MessageSquare className="w-4 h-4 text-brand-primary" />,
            },
            {
              id: "systemAlerts" as const,
              title: "System alerts",
              description: "Important system notifications.",
              icon: <AlertTriangle className="w-4 h-4 text-brand-primary" />,
            },
          ].map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-4 px-6 py-5"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-brand-primaryLighter p-2">
                  {item.icon}
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {item.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggleNotification(item.id)}
                className={`${primaryBtn} ${
                  notificationPrefs[item.id]
                    ? "bg-brand-primary"
                    : "bg-gray-200"
                }`}
                aria-pressed={notificationPrefs[item.id]}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    notificationPrefs[item.id] ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Communication channels & security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-gray-800 px-6 py-5">
            <div className="flex items-center gap-2 text-brand-primary">
              <Mail className="w-4 h-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.3em]">
                Communication channels
              </p>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Delivery methods
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Decide how alerts reach the CSR team for urgent updates.
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[
              {
                id: "email" as const,
                title: "Email",
                description: "Send detailed notifications to csr@staycation.ph",
                icon: <Mail className="w-4 h-4 text-brand-primary" />,
              },
              {
                id: "sms" as const,
                title: "SMS / Viber",
                description: "Escalate urgent cases via +63 912 345 6789",
                icon: <Smartphone className="w-4 h-4 text-brand-primary" />,
              },
              {
                id: "push" as const,
                title: "Push alerts",
                description: "Send banner notifications on CSR dashboard load",
                icon: <Wifi className="w-4 h-4 text-brand-primary" />,
              },
            ].map((channel) => (
              <div
                key={channel.id}
                className="flex items-center justify-between gap-4 px-6 py-5"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-brand-primaryLighter p-2">
                    {channel.icon}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {channel.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {channel.description}
                    </p>
                  </div>
                </div>
                <button
                  className={`${primaryBtn} bg-gray-200`}
                  disabled
                >
                  <span className="inline-block h-5 w-5 transform rounded-full bg-white transition translate-x-1" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-gray-800 px-6 py-5">
            <div className="flex items-center gap-2 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.3em]">
                Security
              </p>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Access & approvals
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Keep the CSR environment compliant by reviewing login activity and
              recovery options.
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[
              {
                title: "Last verified login",
                meta: "Today, 10:42 AM · QC office IP",
                icon: <Fingerprint className="w-4 h-4 text-emerald-600" />,
                action: "Review activity",
              },
              {
                title: "Multi-factor enforcement",
                meta: "Required for all CSR roles",
                icon: <Lock className="w-4 h-4 text-emerald-600" />,
                action: "Manage MFA",
              },
              {
                title: "Recovery contacts",
                meta: "csr-ops@staycation.ph · 2 fallback numbers",
                icon: <Info className="w-4 h-4 text-emerald-600" />,
                action: "Update contacts",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between gap-4 px-6 py-5"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-emerald-50 dark:bg-emerald-900/20 p-2">{item.icon}</div>
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.meta}</p>
                  </div>
                </div>
                <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                  {item.action}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Appearance */}
      <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-gray-800 px-6 py-5">
          <div className="flex items-center gap-2 text-indigo-600">
            <Palette className="w-4 h-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em]">
              Workspace defaults
            </p>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Appearance & localization
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Keep the CSR workspace aligned with your operating hours and
            readability needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-6 py-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Theme mode
            </label>
            <select
              value={appearance.theme}
              onChange={(e) => handleAppearanceChange("theme", e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="light">Light mode</option>
              <option value="dark">Dark mode</option>
              <option value="system">Match system preference</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Density
            </label>
            <select
              value={appearance.density}
              onChange={(e) =>
                handleAppearanceChange("density", e.target.value)
              }
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Language
            </label>
            <select
              value={appearance.language}
              onChange={(e) =>
                handleAppearanceChange("language", e.target.value)
              }
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="en">English (Philippines)</option>
              <option value="fil">Filipino</option>
              <option value="es">Spanish</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Time zone
            </label>
            <select
              value={appearance.timezone}
              onChange={(e) =>
                handleAppearanceChange("timezone", e.target.value)
              }
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="GMT+08">
                GMT+08 — Manila, Hong Kong, Singapore
              </option>
              <option value="GMT+09">GMT+09 — Tokyo, Seoul</option>
              <option value="GMT+07">GMT+07 — Bangkok, Jakarta</option>
            </select>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-red-100 dark:border-red-900/30 px-6 py-5">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em]">
              Advanced controls
            </p>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Session management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Log out idle devices or regenerate API keys if an integration was
            compromised.
          </p>
        </div>

        <div className="flex flex-col gap-4 px-6 py-6">
          <div className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 p-4">
            <div className="flex flex-col gap-1 text-sm text-red-900 dark:text-red-400">
              <p className="font-semibold">Idle device timeout</p>
              <p>Sessions inactive for 45 minutes will be auto-signed out.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Force sign-out on all devices
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Useful if an agent misplaced a laptop or phone.
              </p>
            </div>
            <button className="rounded-xl border border-red-200 dark:border-red-900/30 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/10">
              Sign out sessions
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}