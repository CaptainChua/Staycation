'use client';

import {
  AlertTriangle,
  Bell,
  Fingerprint,
  Image as ImageIcon,
  Info,
  Lock,
  Mail,
  Palette,
  ShieldCheck,
  Smartphone,
  Upload,
  Wifi,
  X,
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const primaryBtn =
  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [notificationPrefs, setNotificationPrefs] = useState({
    bookingAlerts: true,
    revenueUpdates: true,
    maintenanceAlerts: true,
    reviewNotifications: false,
    weeklyDigest: true,
  });

  const [channelPrefs, setChannelPrefs] = useState({
    email: true,
    sms: false,
    push: true,
  });

  const [appearance, setAppearance] = useState({
    theme: theme || "light",
    density: "comfortable",
    language: "en",
    timezone: "GMT+08",
  });

  const [logoSettings, setLogoSettings] = useState({
    currentLogo: "/haven_logo.png",
    uploadedLogo: null as string | null,
  });

  // Sync theme with appearance state using requestAnimationFrame to avoid cascading renders
  useEffect(() => {
    if (theme && theme !== appearance.theme) {
      const rafId = requestAnimationFrame(() => {
        setAppearance((prev) => ({ ...prev, theme }));
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [theme, appearance.theme]);

  const toggleNotification = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleChannel = (key: keyof typeof channelPrefs) => {
    setChannelPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAppearanceChange = (
    field: keyof typeof appearance,
    value: string
  ) => {
    setAppearance((prev) => ({ ...prev, [field]: value }));
    if (field === "theme") setTheme(value);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoSettings((prev) => ({
        ...prev,
        uploadedLogo: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () => {
    setLogoSettings((prev) => ({ ...prev, uploadedLogo: null }));
  };

  const handleLogoSave = () => {
    if (!logoSettings.uploadedLogo) return;
    setLogoSettings((prev) => ({
      ...prev,
      currentLogo: prev.uploadedLogo || prev.currentLogo,
      uploadedLogo: null,
    }));
    // TODO: persist to backend when API is available
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
          Workspace
        </p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
          Configure notification preferences, security controls, and workspace
          defaults for the Owner dashboard experience.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: <Bell className="w-5 h-5 text-brand-primary" />,
            label: "Alerts enabled",
            value: Object.values(notificationPrefs).filter(Boolean).length,
            total: Object.keys(notificationPrefs).length,
            accent: "bg-brand-primaryLighter text-brand-primary",
          },
          {
            icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
            label: "Security health",
            value: "Pass",
            total: "",
            accent: "bg-emerald-50 text-emerald-700",
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
            Choose when owners are notified of booking activity, revenue updates,
            or property management alerts.
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[
            {
              id: "bookingAlerts" as const,
              title: "Booking alerts",
              description: "Instant alerts for new bookings and cancellations.",
            },
            {
              id: "revenueUpdates" as const,
              title: "Revenue updates",
              description:
                "Notify when payments are received or revenue milestones are reached.",
            },
            {
              id: "maintenanceAlerts" as const,
              title: "Maintenance alerts",
              description: "Get notified of maintenance requests and property issues.",
            },
            {
              id: "reviewNotifications" as const,
              title: "Review notifications",
              description:
                "Alert when guests leave reviews or ratings for your properties.",
            },
            {
              id: "weeklyDigest" as const,
              title: "Weekly performance digest",
              description:
                "Email summary each Monday covering revenue, occupancy, and key metrics.",
            },
          ].map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-4 px-6 py-5"
            >
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {item.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
              <button
                onClick={() => toggleNotification(item.id)}
                className={`${primaryBtn} ${
                  notificationPrefs[item.id] ? "bg-brand-primary" : "bg-gray-200"
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
              Decide how alerts reach you for urgent updates.
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[
              {
                id: "email" as const,
                title: "Email",
                description: "Send detailed notifications to your registered email",
                icon: <Mail className="w-4 h-4 text-brand-primary" />,
              },
              {
                id: "sms" as const,
                title: "SMS / Viber",
                description: "Escalate urgent cases via SMS or Viber",
                icon: <Smartphone className="w-4 h-4 text-brand-primary" />,
              },
              {
                id: "push" as const,
                title: "Push alerts",
                description: "Send banner notifications on dashboard load",
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
                  onClick={() => toggleChannel(channel.id)}
                  className={`${primaryBtn} ${
                    channelPrefs[channel.id] ? "bg-brand-primary" : "bg-gray-200"
                  }`}
                  aria-pressed={channelPrefs[channel.id]}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                      channelPrefs[channel.id] ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
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
              Keep your account secure by reviewing login activity and recovery
              options.
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
                meta: "Recommended for all owner accounts",
                icon: <Lock className="w-4 h-4 text-emerald-600" />,
                action: "Manage MFA",
              },
              {
                title: "Recovery contacts",
                meta: "owner@staycation.ph · 2 fallback numbers",
                icon: <Info className="w-4 h-4 text-emerald-600" />,
                action: "Update contacts",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between gap-4 px-6 py-5"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-emerald-50 dark:bg-emerald-900/20 p-2">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.meta}
                    </p>
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

      {/* Logo Settings (owner only) */}
      <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-gray-800 px-6 py-5">
          <div className="flex items-center gap-2 text-brand-primary">
            <ImageIcon className="w-4 h-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em]">
              Branding
            </p>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Logo Settings
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Customize the logo that appears in the sidebar and header.
          </p>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Current Logo
            </p>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-gray-900">
                <Image
                  src={logoSettings.uploadedLogo || logoSettings.currentLogo}
                  alt="Dashboard Logo"
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  This logo appears in the sidebar and header of your dashboard.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Recommended size: 48×48 (square)
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Upload New Logo
            </p>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
              {logoSettings.uploadedLogo ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-gray-900">
                      <Image
                        src={logoSettings.uploadedLogo}
                        alt="Preview"
                        width={80}
                        height={80}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        Preview
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Click save to apply changes
                      </p>
                    </div>
                    <button
                      onClick={handleLogoRemove}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleLogoSave}
                      className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark transition-colors font-semibold text-sm"
                    >
                      Save Logo
                    </button>
                    <button
                      onClick={handleLogoRemove}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-3">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    PNG, JPG, GIF up to 2MB
                  </p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <span className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark transition-colors font-semibold text-sm inline-block">
                    Choose File
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>
      </section>

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
            Keep your workspace aligned with your operating hours and readability
            needs.
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
              onChange={(e) => handleAppearanceChange("density", e.target.value)}
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
              onChange={(e) => handleAppearanceChange("language", e.target.value)}
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
              onChange={(e) => handleAppearanceChange("timezone", e.target.value)}
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
            Log out idle devices or force sign-out across all sessions.
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
                Useful if you misplaced a laptop or phone.
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