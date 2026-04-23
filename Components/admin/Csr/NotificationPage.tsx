"use client";

import { ReactNode, useState } from "react";
import { BellRing, CheckCircle2, Clock, Info, X } from "lucide-react";

type NotificationType = "info" | "success" | "warning";

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: NotificationType;
  read: boolean;
}

interface NotificationPageProps {
  onClose?: () => void;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New booking pending approval",
    description: "A new booking for Haven 2 requires CSR confirmation.",
    timestamp: "2 mins ago",
    type: "info",
    read: false,
  },
  {
    id: "2",
    title: "Payment received",
    description: "₱12,500 from Emily Brown was confirmed.",
    timestamp: "15 mins ago",
    type: "success",
    read: false,
  },
  {
    id: "3",
    title: "Guest check-in reminder",
    description: "Mike Wilson will arrive today at 3:00 PM.",
    timestamp: "1 hr ago",
    type: "warning",
    read: true,
  },
  {
    id: "4",
    title: "Inventory restocked",
    description: "Housekeeping restocked linens for Haven 1.",
    timestamp: "2 hrs ago",
    type: "info",
    read: true,
  },
];

const iconMap: Record<NotificationType, ReactNode> = {
  info: <Info className="w-4 h-4" />,
  success: <CheckCircle2 className="w-4 h-4" />,
  warning: <Clock className="w-4 h-4" />,
};

const badgeStyles: Record<NotificationType, string> = {
  info: "bg-blue-50 text-blue-600 border-blue-100",
  success: "bg-green-50 text-green-600 border-green-100",
  warning: "bg-amber-50 text-amber-600 border-amber-100",
};

export default function NotificationPage({ onClose }: NotificationPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visibleNotifications = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Review booking, payment, and guest updates that need your attention.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent</h2>
            {unreadCount > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">• {unreadCount} unread</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-gray-100 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  filter === "all"
                    ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-gray-100"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  filter === "unread"
                    ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-gray-100"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                Unread
              </button>
            </div>

            <button
              type="button"
              onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-semibold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors"
            >
              <BellRing className="w-4 h-4" />
              Mark all as read
            </button>
          </div>
        </div>

        <div className="max-h-[72vh] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {visibleNotifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() =>
                setNotifications((prev) =>
                  prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
                )
              }
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                notification.read
                  ? "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  : "bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${badgeStyles[notification.type]}`}>
                    {iconMap[notification.type]}
                  </div>
                </div>
                {!notification.read && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-blue-600 border-2 border-white rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug">
                  <span className="font-semibold">{notification.title}</span>
                  <span className="text-gray-600 dark:text-gray-300"> — {notification.description}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.timestamp}</p>
              </div>
            </button>
          ))}

          {visibleNotifications.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">No notifications to show.</div>
          )}
        </div>
      </div>
    </div>
  );
}
