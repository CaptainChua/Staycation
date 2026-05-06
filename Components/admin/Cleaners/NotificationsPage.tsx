"use client";

import { Bell, CheckCircle, AlertTriangle, Info, Clock, Filter, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "info";
  time: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch('/api/notifications?limit=50', { cache: 'no-store' });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setNotificationsList(
            data.data.map((n: any) => ({
              id: String(n.id),
              title: n.title,
              message: n.description,
              type: n.type as "success" | "warning" | "info",
              time: n.timestamp,
              read: n.read,
            }))
          );
        }
      } catch {
        // silently fail — empty list shown
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const markAsRead = async (id: string) => {
    setNotificationsList(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [id], markAs: 'read' }),
      });
    } catch {}
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Parse notification content for navigation
    const lowerTitle = notification.title.toLowerCase();
    const lowerMessage = notification.message.toLowerCase();
    
    if (lowerTitle.includes('assignment') || lowerTitle.includes('schedule')) {
      router.push('/cleaners/my-schedule');
    } else if (lowerTitle.includes('message') || lowerMessage.includes('message')) {
      router.push('/cleaners/messages');
    } else if (lowerTitle.includes('task') || lowerMessage.includes('task')) {
      // Try to extract task ID (e.g., "Task #123")
      const taskMatch = notification.title.match(/#(\d+)/) || notification.message.match(/#(\d+)/);
      if (taskMatch) {
        router.push(`/cleaners/my-assignment?task=${taskMatch[1]}`);
      } else {
        router.push('/cleaners/my-assignment');
      }
    } else if (lowerTitle.includes('issue') || lowerTitle.includes('report')) {
      router.push('/cleaners/report-issue');
    } else {
      // Default to schedule
      router.push('/cleaners/my-schedule');
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notificationsList.filter(n => !n.read).map(n => n.id);
    setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
    if (unreadIds.length === 0) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: unreadIds, markAs: 'read' }),
      });
    } catch {}
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return CheckCircle;
      case "warning": return AlertTriangle;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success": return "bg-green-500";
      case "warning": return "bg-yellow-500";
      default: return "bg-brand-primary";
    }
  };

  const filteredNotifications = notificationsList.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const unreadCount = notificationsList.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={markAllAsRead}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primaryDark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Check className="w-4 h-4" />
          Mark All Read
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Filter by:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "unread", "warning", "success", "info"].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                filter === filterType
                  ? "bg-brand-primary text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {filterType}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No notifications found</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const NotificationIcon = getNotificationIcon(notification.type);
            const colorClass = getNotificationColor(notification.type);

            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-5 transition-all hover:shadow-xl cursor-pointer group ${
                  !notification.read ? "border-l-4 border-brand-primary ring-2 ring-brand-primary/20" : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`${colorClass} p-3 rounded-lg text-white flex-shrink-0`}>
                    <NotificationIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-brand-primary transition-colors">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="flex-shrink-0 w-3 h-3 bg-brand-primary rounded-full mt-1.5 animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{notification.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
