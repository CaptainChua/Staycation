"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  Phone,
  Video,
  Info,
  Send,
  Plus,
  Image as ImageIcon,
  Smile,
  X,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkMessagesAsReadMutation,
} from "@/redux/api/messagesApi";
import { useGetEmployeesQuery } from "@/redux/api/employeeApi";
import toast from "react-hot-toast";
import NewMessageModal from "./Modals/NewMessageModal";

interface MessagePageProps {
  onClose?: () => void;
  initialConversationId?: string | null;
}

interface Employee {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  employment_id?: string;
  profile_image_url?: string;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name?: string;
  message_text: string;
  created_at: string;
}

interface Conversation {
  id: string;
  name?: string;
  type: string;
  participant_ids?: string[];
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

// Helper functions defined outside the component to avoid conditional hooks
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
  return date.toLocaleDateString();
};

const formatMessageTime = (timestamp: string) => {
  // Convert UTC timestamp to Philippine time (UTC+8)
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
    hour12: true,
  });
};

const getActiveStatus = (lastMessageTime: string | undefined, type: string) => {
  if (!lastMessageTime || type !== "internal") {
    return { isActive: false, statusText: type === "internal" ? "Offline" : "Guest" };
  }

  const now = new Date();
  const lastActive = new Date(lastMessageTime);
  const diffMs = now.getTime() - lastActive.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  // Active if last message was within 3 minutes
  if (diffMins < 3) {
    return { isActive: true, statusText: "Active now" };
  }

  // Show last active time
  if (diffMins < 60) {
    return { isActive: false, statusText: `Active ${diffMins}m ago` };
  }

  if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return { isActive: false, statusText: `Active ${hours}h ago` };
  }

  return { isActive: false, statusText: "Offline" };
};

// Skeleton component defined outside the main component
const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-800 ${className}`} />
);

export default function MessagesPage({ onClose, initialConversationId }: MessagePageProps) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;

  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const hasInitializedActiveId = useRef(false);
  const hasProcessedInitialConversationId = useRef(false);

  // Common emojis organized by category
  const emojiCategories = {
    smileys: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "😜", "🤪", "😎", "🤩", "🥳"],
    gestures: ["👍", "👎", "👏", "🙌", "🤝", "🙏", "💪", "✌️", "🤞", "🤟", "🤘", "👌", "👋", "🤚", "✋", "🖐️", "👆", "👇", "👈", "👉"],
    hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️"],
    objects: ["🎉", "🎊", "🎁", "🎈", "✨", "🌟", "⭐", "🔥", "💯", "✅", "❌", "⚠️", "📌", "📍", "💡", "🔔", "📢", "💬", "💭", "🗨️"],
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleEmojiSelect = (emoji: string) => {
    setDraft((prev) => prev + emoji);
  };

  // Fetch conversations
  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useGetConversationsQuery(
    { userId: userId || "" },
    { skip: !userId, pollingInterval: 5000 }
  );

  const conversations = useMemo(() => conversationsData?.data || [], [conversationsData?.data]);

  // Compute initial active conversation ID
  const getInitialActiveId = useCallback((): string | null => {
    if (conversations.length === 0) return null;

    if (initialConversationId) {
      const exists = conversations.some((c: Conversation) => c.id === initialConversationId);
      if (exists) return initialConversationId;
    }

    return conversations[0]?.id || null;
  }, [conversations, initialConversationId]);

  const [activeId, setActiveId] = useState<string | null>(null);

  // Initialize activeId once when conversations are loaded - FIXED VERSION
  useEffect(() => {
    // Only run this effect once when conversations are loaded and we haven't initialized activeId yet
    if (conversations.length > 0 && !hasInitializedActiveId.current) {
      const initialActiveId = getInitialActiveId();
      if (initialActiveId !== activeId) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveId(initialActiveId);
      }
      hasInitializedActiveId.current = true;
    }
  }, [conversations.length, activeId, getInitialActiveId]);

  // Update activeId when initialConversationId changes - FIXED VERSION
  useEffect(() => {
    // Skip if we've already processed the initialConversationId
    if (initialConversationId && conversations.length > 0 && !hasProcessedInitialConversationId.current) {
      const exists = conversations.some((c: Conversation) => c.id === initialConversationId);
      if (exists && initialConversationId !== activeId) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveId(initialConversationId);
      }
      hasProcessedInitialConversationId.current = true;
    }
  }, [initialConversationId, conversations, activeId]);

  // Fetch messages for active conversation
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useGetMessagesQuery(
    { conversationId: activeId || "" },
    { skip: !activeId, pollingInterval: 3000 }
  );

  // Mutations
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [markAsRead] = useMarkMessagesAsReadMutation();

  const messages = useMemo(() => messagesData?.data || [], [messagesData?.data]);
  const { data: employeesData } = useGetEmployeesQuery({});
  const employees = useMemo(() => employeesData?.data || [], [employeesData?.data]);

  const employeeMap = useMemo(() => {
    const map: Record<string, string> = {};
    employees.forEach((emp: Employee) => {
      const name = `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim();
      map[emp.id] = name || emp.email || emp.employment_id || "Employee";
    });
    return map;
  }, [employees]);

  const employeeProfileImageById = useMemo(() => {
    const map: Record<string, string> = {};
    employees.forEach((emp: Employee) => {
      if (emp?.id && emp?.profile_image_url) {
        map[emp.id] = emp.profile_image_url;
      }
    });
    return map;
  }, [employees]);

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (activeId && userId) {
      markAsRead({ conversation_id: activeId, user_id: userId });
    }
  }, [activeId, userId, markAsRead]);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getConversationDisplayName = useCallback((conversation: Conversation | undefined | null) => {
    if (!conversation) return "";
    if (conversation.type === "guest") {
      return conversation.name;
    }

    const otherParticipantIds = (conversation.participant_ids || []).filter(
      (id: string) => id !== userId
    );
    const otherNames = otherParticipantIds
      .map((id: string) => employeeMap[id])
      .filter(Boolean);

    if (otherNames.length > 0) {
      return otherNames.join(", ");
    }

    return conversation.name;
  }, [employeeMap, userId]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? conversations[0],
    [activeId, conversations]
  );

  const activeConversationName = getConversationDisplayName(activeConversation);
  const activeConversationOtherParticipantIds = userId
    ? (activeConversation?.participant_ids || []).filter((id: string) => id !== userId)
    : (activeConversation?.participant_ids || []);
  const activeConversationAvatarUrl =
    activeConversation?.type !== "guest" && activeConversationOtherParticipantIds.length === 1
      ? employeeProfileImageById[activeConversationOtherParticipantIds[0]]
      : undefined;

  const showSkeletonConversations = isLoadingConversations && conversations.length === 0;
  const showSkeletonMessages = isLoadingMessages && messages.length === 0;

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((c: Conversation) => {
      return (
        c.name?.toLowerCase().includes(term) ||
        (c.last_message && c.last_message.toLowerCase().includes(term)) ||
        c.type.toLowerCase().includes(term)
      );
    });
  }, [search, conversations]);

  const handleSendMessage = async () => {
    const text = draft.trim();
    if (!text || !activeId || !userId) return;

    try {
      await sendMessage({
        conversation_id: activeId,
        sender_id: userId,
        sender_name: session?.user?.name || "Owner",
        message_text: text,
      }).unwrap();

      setDraft("");
      refetchMessages();
      refetchConversations();
    } catch (error: unknown) {
      console.error("Failed to send message:", error);
      const errorMessage = error && typeof error === 'object' && 'data' in error
        ? (error as { data?: { error?: string } }).data?.error
        : "Failed to send message";
      toast.error(errorMessage || "Failed to send message");
    }
  };

  // Use useCallback for memoized functions - MOVED OUTSIDE CONDITIONAL RENDER
  const memoizedFormatTime = useCallback((timestamp: string) => formatTime(timestamp), []);
  const memoizedFormatMessageTime = useCallback((timestamp: string) => formatMessageTime(timestamp), []);
  const memoizedGetActiveStatus = useCallback(
    (lastMessageTime: string | undefined, type: string) => getActiveStatus(lastMessageTime, type),
    []
  );

  if (showSkeletonConversations) {
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 rounded" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr]">
            <div className="border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-[72vh]">
              <div className="h-16 px-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800">
                <Skeleton className="h-5 w-24 rounded" />
              </div>
              <div className="p-4">
                <Skeleton className="h-10 w-full rounded-full" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
                    <Skeleton className="w-11 h-11 rounded-full" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-4 w-40 rounded" />
                      <Skeleton className="h-3 w-32 rounded" />
                    </div>
                    <Skeleton className="h-4 w-10 rounded" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 flex flex-col h-[72vh]">
              <div className="h-16 px-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className={`flex ${idx % 2 === 0 ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[75%] flex flex-col gap-2 ${idx % 2 === 0 ? "items-start" : "items-end"}`}>
                      <Skeleton className={`h-10 ${idx % 2 === 0 ? "w-48" : "w-40"} rounded-2xl`} />
                      <Skeleton className="h-3 w-16 rounded" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 flex-1 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="animate-in fade-in duration-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Messages</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Review and respond to guest and internal chat updates.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr]">
            <div className={`border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-[calc(100vh-180px)] sm:h-[65vh] lg:h-[72vh] ${showMobileChat ? "hidden lg:flex" : "flex"}`}>
              <div className="h-14 sm:h-16 px-3 sm:px-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">Chats</p>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewMessageModalOpen(true)}
                    className="p-2 rounded-full hover:bg-brand-primaryLighter transition-colors"
                    title="New message"
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-full hover:bg-brand-primaryLighter transition-colors"
                      title="Close"
                      type="button"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Messenger"
                    className="w-full pl-10 pr-3 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/30"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                  </div>
                ) : (
                  filteredConversations.map((c) => {
                    const isActive = c.id === activeId;
                    const conversationName = getConversationDisplayName(c);
                    const activeStatus = memoizedGetActiveStatus(c.last_message_time, c.type);
                    const otherParticipantIds = userId
                      ? (c.participant_ids || []).filter((id: string) => id !== userId)
                      : (c.participant_ids || []);
                    const avatarUrl =
                      c.type !== "guest" && otherParticipantIds.length === 1
                        ? employeeProfileImageById[otherParticipantIds[0]]
                        : undefined;
                    const avatarLetter = (conversationName || c.name || "?")
                      .charAt(0)
                      .toUpperCase();
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setActiveId(c.id);
                          setShowMobileChat(true);
                        }}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2.5 sm:gap-3 text-left transition-colors ${
                          isActive
                            ? "bg-brand-primaryLighter dark:bg-gray-800"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                      >
                        <div className="relative">
                          <div className="w-11 h-11 rounded-full bg-brand-primary text-white font-bold flex items-center justify-center">
                            {avatarUrl ? (
                              <Image
                                src={avatarUrl}
                                alt={conversationName || c.name || "Conversation"}
                                width={44}
                                height={44}
                                className="w-11 h-11 rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              avatarLetter
                            )}
                          </div>
                          {activeStatus.isActive && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {conversationName || c.name}
                            </p>
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-xs text-gray-400 whitespace-nowrap">
                              {c.last_message_time ? memoizedFormatTime(c.last_message_time) : ""}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {activeStatus.statusText}
                          </p>
                        </div>

                        {(c.unread_count || 0) > 0 && (
                          <div className="w-6 flex justify-end">
                            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-brand-primary text-white text-xs font-bold">
                              {c.unread_count}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className={`bg-white dark:bg-gray-900 flex flex-col h-[calc(100vh-180px)] sm:h-[65vh] lg:h-[72vh] ${showMobileChat ? "flex" : "hidden lg:flex"}`}>
              {activeConversation ? (
                <>
                  <div className="h-14 sm:h-16 px-2 sm:px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => setShowMobileChat(false)}
                        className="p-1.5 sm:p-2 rounded-full hover:bg-brand-primaryLighter transition-colors lg:hidden cursor-pointer"
                        title="Back"
                      >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-primary text-white font-bold flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {activeConversationAvatarUrl ? (
                          <Image
                            src={activeConversationAvatarUrl}
                            alt={activeConversationName || activeConversation.name || "Conversation"}
                            width={40}
                            height={40}
                            className="w-8 h-8 sm:w-10 sm:h-10 object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-sm sm:text-base">
                            {(activeConversationName || activeConversation.name || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                          {activeConversationName || activeConversation.name}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                          {memoizedGetActiveStatus(activeConversation.last_message_time, activeConversation.type).statusText}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <button type="button" className="p-1.5 sm:p-2 rounded-full hover:bg-brand-primaryLighter transition-colors" title="Call">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                      </button>
                      <button type="button" className="p-1.5 sm:p-2 rounded-full hover:bg-brand-primaryLighter transition-colors hidden sm:block" title="Video">
                        <Video className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                      </button>
                      <button type="button" className="p-1.5 sm:p-2 rounded-full hover:bg-brand-primaryLighter transition-colors" title="Info">
                        <Info className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 px-2 sm:px-4 py-3 sm:py-4 space-y-2 sm:space-y-3">
                    {showSkeletonMessages ? (
                      Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className={`flex ${idx % 2 === 0 ? "justify-start" : "justify-end"}`}>
                          <div className={`max-w-[75%] flex flex-col gap-2 ${idx % 2 === 0 ? "items-start" : "items-end"}`}>
                            <Skeleton className={`h-10 ${idx % 2 === 0 ? "w-48" : "w-40"} rounded-2xl`} />
                            <Skeleton className="h-3 w-16 rounded" />
                          </div>
                        </div>
                      ))
                    ) : isLoadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                      </div>
                    ) : messages.length > 0 ? (
                      messages.map((m: Message) => {
                        const isMe = m.sender_id === userId;
                        const senderLabel = !isMe
                          ? employeeMap[m.sender_id] ||
                            m.sender_name ||
                            (activeConversation?.type === "guest" ? "Guest" : "Staff")
                          : undefined;
                        return (
                          <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] sm:max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5 sm:gap-1`}>
                              {!isMe && senderLabel && (
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
                                  {senderLabel}
                                </span>
                              )}
                              <div
                                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                                  isMe
                                    ? "bg-brand-primary text-white rounded-br-md"
                                    : "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-bl-md"
                                }`}
                              >
                                {m.message_text}
                              </div>
                              <span className="text-[10px] sm:text-[11px] text-gray-400">{memoizedFormatMessageTime(m.created_at)}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-center h-full text-center">
                        <p className="text-gray-500">No messages yet. Start the conversation!</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setIsNewMessageModalOpen(true)}
                        className="p-1.5 sm:p-2 rounded-full hover:bg-brand-primaryLighter transition-colors hidden sm:block"
                        title="New message"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                      </button>
                      <button type="button" className="p-1.5 sm:p-2 rounded-full hover:bg-brand-primaryLighter transition-colors" title="Attach">
                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                      </button>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 border border-gray-200 dark:border-gray-700 focus-within:bg-brand-primaryLighter dark:focus-within:bg-gray-800 focus-within:border-brand-primary dark:focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20">
                        <input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !isSending) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Aa"
                          disabled={isSending}
                          className="flex-1 bg-transparent outline-none text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                        />
                        <div className="relative" ref={emojiPickerRef}>
                          <button
                            type="button"
                            className="p-1 sm:p-1.5 rounded-full hover:bg-brand-primaryLighter transition-colors cursor-pointer"
                            title="Emoji"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          >
                            <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                          </button>

                          {showEmojiPicker && (
                            <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 w-[280px] sm:w-[320px] max-h-[280px] overflow-y-auto z-50">
                              {Object.entries(emojiCategories).map(([category, emojis]) => (
                                <div key={category} className="mb-3 last:mb-0">
                                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 capitalize">{category}</p>
                                  <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
                                    {emojis.map((emoji, index) => (
                                      <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                          handleEmojiSelect(emoji);
                                        }}
                                        className="w-7 h-7 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={isSending || !draft.trim()}
                        className="p-1.5 sm:p-2 rounded-full hover:bg-brand-primaryLighter transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
                        title="Send"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <NewMessageModal
          isOpen={isNewMessageModalOpen}
          onClose={() => setIsNewMessageModalOpen(false)}
          currentUserId={userId || ""}
          onConversationCreated={(conversationId) => {
            setActiveId(conversationId);
            refetchConversations();
          }}
        />
      </div>
    );
  }
