"use client";

import { Bell, CheckCircle, AlertTriangle, Info, Clock, Filter, Check } from "lucide-react";
import { useState } from "react";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "success" | "warning" | "info" | "urgent";
  time: string;
  read: boolean;
}

interface NotificationsPageProps {
  notifications?: Notification[];
}

export default function NotificationsPage({ notifications: propNotifications }: NotificationsPageProps) {
  const [filter, setFilter] = useState<string>("all");
  const [notificationsList, setNotificationsList] = useState<Notification[]>(
    propNotifications || [
      {
        id: 1,
        title: "New Assignment",
        message: "You have been assigned to clean Haven 15 today at 4:00 PM",
        type: "info",
        time: "5 minutes ago",
        read: false,
      },
      {
        id: 2,
        title: "Task Completed",
        message: "Haven 3 cleaning has been marked as completed",
        type: "success",
        time: "1 hour ago",
        read: false,
      },
      {
        id: 3,
        title: "Urgent: Priority Change",
        message: "Haven 7 has been upgraded to high priority. Please complete by 2:00 PM",
        type: "urgent",
        time: "2 hours ago",
        read: true,
      },
      {
        id: 4,
        title: "Maintenance Alert",
        message: "Your report for Haven 12 plumbing issue is under review",
        type: "warning",
        time: "3 hours ago",
        read: true,
      },
      {
        id: 5,
        title: "Schedule Update",
        message: "Your schedule for tomorrow has been updated with 4 new assignments",
        type: "info",
        time: "5 hours ago",
        read: true,
      },
      {
        id: 6,
        title: "Checklist Reminder",
        message: "Don't forget to complete the cleaning checklist for Haven 8",
        type: "warning",
        time: "Yesterday",
        read: true,
      },
      {
        id: 7,
        title: "Feedback Received",
        message: "Great job on Haven 5! The guest left a 5-star cleanliness rating",
        type: "success",
        time: "Yesterday",
        read: true,
      },
      {
        id: 8,
        title: "Training Session",
        message: "New cleaning protocols training scheduled for next Monday at 9:00 AM",
        type: "info",
        time: "2 days ago",
        read: true,
      },
    ]
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return CheckCircle;
      case "warning":
        return AlertTriangle;
      case "urgent":
        return Bell;
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "urgent":
        return "bg-red-500";
      default:
        return "bg-brand-primary";
    }
  };

  const markAsRead = (id: number) => {
    setNotificationsList(
      notificationsList.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotificationsList(notificationsList.map((notif) => ({ ...notif, read: true })));
  };

  const filteredNotifications = notificationsList.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.read;
    return notif.type === filter;
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
          {["all", "unread", "urgent", "warning", "success", "info"].map((filterType) => (
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
        {filteredNotifications.length === 0 ? (
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
                onClick={() => markAsRead(notification.id)}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-5 cursor-pointer transition-all hover:shadow-xl ${
                  !notification.read ? "border-l-4 border-brand-primary" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`${colorClass} p-3 rounded-lg text-white flex-shrink-0`}>
                    <NotificationIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="flex-shrink-0 w-2 h-2 bg-brand-primary rounded-full mt-2"></span>
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
