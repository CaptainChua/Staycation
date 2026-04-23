"use client";

import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BellRing, CheckCircle2, Clock, Info, X } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type?: "info" | "success" | "warning";
}

type LocalNotification = Notification & { read: boolean };

interface NotificationModalProps {
  notifications: Notification[];
  onClose: () => void;
  onViewAll?: () => void;
  anchorRef?: RefObject<HTMLElement | null>;
}

const iconMap: Record<string, ReactNode> = {
  info: <Info className="w-4 h-4" />,
  success: <CheckCircle2 className="w-4 h-4" />,
  warning: <Clock className="w-4 h-4" />,
};

const typeStyles: Record<NonNullable<Notification["type"]>, { wrapper: string; iconWrap: string }> = {
  info: {
    wrapper: "border border-gray-100 hover:border-brand-primary/30",
    iconWrap: "bg-brand-primaryLighter text-brand-primary",
  },
  success: {
    wrapper: "border border-gray-100 hover:border-green-200",
    iconWrap: "bg-green-50 text-green-600",
  },
  warning: {
    wrapper: "border border-gray-100 hover:border-yellow-200",
    iconWrap: "bg-yellow-50 text-yellow-600",
  },
};

export default function NotificationModal({ notifications, onClose, onViewAll, anchorRef }: NotificationModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ top: 96, right: 16 });
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [items, setItems] = useState<LocalNotification[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Use requestAnimationFrame to avoid cascading renders
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => {
      cancelAnimationFrame(rafId);
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    function updatePosition() {
      if (!anchorRef?.current) {
        setPosition({ top: 96, right: 16 });
        return;
      }

      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 12,
        right: Math.max(window.innerWidth - rect.right - 16, 16),
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    document.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !anchorRef?.current?.contains(target)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [anchorRef, onClose, isMounted]);

  // Initialize items from notifications without triggering cascading renders
  useEffect(() => {
    if (!isMounted) return;
    
    // Use a timeout to batch the state update
    const timeoutId = setTimeout(() => {
      setItems((prev) => {
        const prevMap = new Map(prev.map((n) => [n.id, n]));
        return notifications.map((n) => {
          const existing = prevMap.get(n.id);
          return {
            ...n,
            read: existing?.read ?? false,
          };
        });
      });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [notifications, isMounted]);

  const unreadCount = items.filter((n) => !n.read).length;
  const visibleItems = filter === "unread" ? items.filter((n) => !n.read) : items;

  if (!isMounted) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9980]" aria-hidden="true" />
      <div
        ref={containerRef}
        className="fixed z-[9991] w-full max-w-md md:max-w-sm"
        style={{
          top: position.top,
          right: position.right,
        }}
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden border border-brand-primary/20 dark:border-gray-800">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center">
                <BellRing className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.3em] text-brand-primary uppercase">
                  Notifications
                </p>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent</h2>
                  {unreadCount > 0 && <span className="text-sm text-gray-500 dark:text-gray-400">• {unreadCount} unread</span>}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-brand-primaryLighter dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-300"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-2">
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

            <div className="ml-auto">
              <button
                type="button"
                onClick={() => {
                  // Use setTimeout to batch the state update
                  setTimeout(() => {
                    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
                  }, 0);
                }}
                className="text-sm font-semibold text-brand-primary hover:text-brand-primaryDark transition-colors"
              >
                Mark all as read
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {visibleItems.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-500 dark:text-gray-400">You&apos;re all caught up!</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {visibleItems.map((notification) => {
                  const type = notification.type || "info";
                  const styles = typeStyles[type];
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => {
                        // Use setTimeout to batch the state update
                        setTimeout(() => {
                          setItems((prev) =>
                            prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
                          );
                        }, 0);
                      }}
                      className={`w-full text-left px-6 py-4 flex items-start gap-3 transition-colors ${
                        notification.read
                          ? "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          : "bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${styles.iconWrap}`}>
                            {iconMap[type]}
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
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <button
              onClick={() => {
                if (onViewAll) {
                  onViewAll();
                }
              }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-primaryDark transition-colors"
              type="button"
            >
              View all notifications
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}