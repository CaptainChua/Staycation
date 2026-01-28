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
  XCircle,
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
import { toast } from "react-hot-toast";
import axios from "axios";

const primaryBtn =
  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  // CSR Front Desk Notification Settings
  const [notificationPrefs, setNotificationPrefs] = useState({
    newBookings: true,
    paymentConfirmations: true,
    checkInNotifications: true,
    checkOutNotifications: true,
    cleaningUpdates: true,
    deliverableUpdates: true,
    guestMessages: true,
    systemAlerts: true,
    emergencyAlerts: true,
    maintenanceAlerts: true,
    lowInventoryAlerts: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from backend
  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    setHasChanges(true);
  }, [notificationPrefs]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/admin/settings/csr');
      const data = response.data;
      
      if (data.notificationPrefs) setNotificationPrefs(data.notificationPrefs);
      
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      await axios.post('/api/admin/settings/csr', {
        notificationPrefs,
      });
      
      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    setNotificationPrefs({
      newBookings: true,
      paymentConfirmations: true,
      checkInNotifications: true,
      checkOutNotifications: true,
      cleaningUpdates: true,
      deliverableUpdates: true,
      guestMessages: true,
      systemAlerts: true,
      emergencyAlerts: true,
      maintenanceAlerts: true,
      lowInventoryAlerts: false,
    });
    toast.success('Settings reset to defaults');
  };

  const toggleNotification = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
          CSR Front Desk
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <div className="flex gap-2">
            {hasChanges && (
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Reset to Defaults
              </button>
            )}
            <button
              onClick={saveSettings}
              disabled={!hasChanges || isLoading}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
          Configure your CSR front desk notification preferences and delivery methods.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            icon: <Bell className="w-5 h-5 text-brand-primary" />,
            label: "Active notifications",
            value: Object.values(notificationPrefs).filter(Boolean).length,
            total: Object.keys(notificationPrefs).length,
            accent: "bg-brand-primaryLighter text-brand-primary",
          },
          {
            icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
            label: "Security status",
            value: "Enabled",
            total: "",
            accent: "bg-emerald-50 text-emerald-700",
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
            {
              id: "emergencyAlerts" as const,
              title: "Emergency alerts",
              description: "Urgent guest emergencies and safety issues.",
              icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
            },
            {
              id: "maintenanceAlerts" as const,
              title: "Maintenance alerts",
              description: "Room maintenance and facility issues.",
              icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
            },
            {
              id: "lowInventoryAlerts" as const,
              title: "Low inventory alerts",
              description: "When supplies or amenities are running low.",
              icon: <Package className="w-4 h-4 text-yellow-600" />,
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