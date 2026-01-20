"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, ArrowRight, Check } from "lucide-react";
import Image from "next/image";

interface MessagePreview {
  id: string;
  name: string;
  participant_ids?: string[];
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  type?: string;
}

interface MessageModalProps {
  conversations: MessagePreview[];
  currentUserId?: string;
  employeeNameById?: Record<string, string>;
  employeeProfileImageById?: Record<string, string>;
  onSelectConversation?: (conversationId: string) => void;
  onClose: () => void;
  onViewAll?: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
  isLoading?: boolean;
}

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`} />
);

export default function MessageModal({
  conversations,
  currentUserId,
  employeeNameById,
  employeeProfileImageById,
  onSelectConversation,
  onClose,
  onViewAll,
  anchorRef,
  isLoading,
}: MessageModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ top: 96, right: 16 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Hydration fix: prevent SSR mismatch with portal rendering
  // Use an effect with cleanup to handle mounting state
  useEffect(() => {
    // Use requestAnimationFrame to schedule state update after initial render
    const rafId = requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => {
      cancelAnimationFrame(rafId);
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
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
  }, [anchorRef]);

  useEffect(() => {
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
  }, [anchorRef, onClose]);

  if (!isMounted) return null;

  const getConversationDisplayName = (conversation: MessagePreview) => {
    if (!conversation) return "";
    if (conversation.type === "guest") {
      return conversation.name;
    }

    const ids = conversation.participant_ids || [];
    const otherParticipantIds = currentUserId
      ? ids.filter((id) => id !== currentUserId)
      : ids;
    const otherNames = otherParticipantIds
      .map((id) => employeeNameById?.[id])
      .filter(Boolean) as string[];

    if (otherNames.length > 0) {
      return otherNames.join(", ");
    }

    return conversation.name;
  };

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const topConversations = conversations.slice(0, 5);

  return createPortal(
    <div
      ref={containerRef}
      className="fixed z-[9991] w-full max-w-md md:max-w-sm"
        style={{
          top: position.top,
          right: position.right,
        }}
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-brand-primary/20 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.3em] text-brand-primary uppercase">
                  Messages
                </p>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Inbox</h2>
                  {unreadTotal > 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      • {unreadTotal} unread
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-brand-primaryLighter dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-300"
              type="button"
              aria-label="Close messages"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {isLoading ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="px-6 py-4 flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <Skeleton className="w-12 h-12 rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-3 w-16 rounded" />
                      </div>
                      <Skeleton className="h-3 w-40 rounded mt-2" />
                      <Skeleton className="h-3 w-20 rounded mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topConversations.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-500 dark:text-gray-400">
                No conversations yet. Start messaging guests or teammates!
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {topConversations.map((conversation) => {
                  const displayName = getConversationDisplayName(conversation);
                  const otherParticipantIds = currentUserId
                    ? (conversation.participant_ids || []).filter((id) => id !== currentUserId)
                    : conversation.participant_ids || [];
                  const avatarUrl =
                    conversation.type !== "guest" && otherParticipantIds.length === 1
                      ? employeeProfileImageById?.[otherParticipantIds[0]]
                      : undefined;
                  const avatarLetter = (displayName || conversation.name || "?")
                    .charAt(0)
                    .toUpperCase();
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => {
                        if (onSelectConversation) {
                          onSelectConversation(conversation.id);
                          return;
                        }
                        if (onViewAll) onViewAll();
                        onClose();
                      }}
                      className="w-full text-left px-6 py-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-brand-primary text-white font-semibold flex items-center justify-center overflow-hidden">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={displayName || "Conversation"}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                              }}
                            />
                          ) : (
                            avatarLetter
                          )}
                        </div>
                        {(conversation.unread_count || 0) > 0 && (
                          <span className="absolute -bottom-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {displayName || conversation.name || "Conversation"}
                          </p>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatTimestamp(conversation.last_message_time)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conversation.last_message || "No messages yet"}
                        </p>
                        {conversation.type === "guest" && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-brand-primary mt-1">
                            <Check className="w-3 h-3" /> Guest
                          </span>
                        )}
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
                if (onViewAll) onViewAll();
                onClose();
              }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-primaryDark transition-colors"
              type="button"
            >
              View all messages
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
    </div>,
    document.body
  );
}
