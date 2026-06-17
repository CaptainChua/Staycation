"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  Send,
  Plus,
  Image as ImageIcon,
  X,
  Loader2,
  ArrowLeft,
  ZoomIn,
  Smile,
  Play,
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
  role?: string;
}

// Role filter dropdown — values map 1:1 to employees.role except "all" (no filter)
// and "Guest" (synthetic — applies to conversations of type "guest" which don't
// have a backing employee row).
type RoleFilter = "all" | "Owner" | "CSR" | "Cleaner" | "Partner" | "Guest";
const ROLE_FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "Owner", label: "Owner" },
  { value: "CSR", label: "CSR" },
  { value: "Cleaner", label: "Cleaner" },
  { value: "Partner", label: "Partner" },
  { value: "Guest", label: "Guest" },
];

interface Message {
  id: string;
  sender_id: string;
  sender_name?: string;
  message_text: string;
  image_url?: string | null;
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

// ─── helpers ────────────────────────────────────────────────────────────────

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
  return date.toLocaleDateString();
};

const formatMessageTime = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
    hour12: true,
  });

const getActiveStatus = (lastMessageTime: string | undefined, type: string) => {
  if (!lastMessageTime || type !== "internal")
    return { isActive: false, statusText: type === "internal" ? "Offline" : "Guest" };
  const diffMins = Math.floor((Date.now() - new Date(lastMessageTime).getTime()) / 60000);
  if (diffMins < 3) return { isActive: true, statusText: "Active now" };
  if (diffMins < 60) return { isActive: false, statusText: `Active ${diffMins}m ago` };
  if (diffMins < 1440)
    return { isActive: false, statusText: `Active ${Math.floor(diffMins / 60)}h ago` };
  return { isActive: false, statusText: "Offline" };
};

// Detect whether a stored message is a media attachment. Newer attachments are
// Cloudinary URLs; older images may still be inline base64 data URLs.
const getMediaType = (text: string): "image" | "video" | "text" => {
  if (!text) return "text";
  if (text.startsWith("data:image")) return "image";
  if (text.startsWith("data:video")) return "video";
  if (/res\.cloudinary\.com/i.test(text)) {
    return /\/video\/upload\//i.test(text) ? "video" : "image";
  }
  return "text";
};

// Resolve a message's attachment from either the image_url column (used by the
// CSR side) or an inline message_text URL/base64 (used by the cleaner side).
const getMessageMedia = (
  m: { image_url?: string | null; message_text?: string },
): { src: string; type: "image" | "video" } | null => {
  if (m.image_url) {
    return { src: m.image_url, type: /\/video\/upload\//i.test(m.image_url) ? "video" : "image" };
  }
  const t = getMediaType(m.message_text || "");
  if (t === "text") return null;
  return { src: m.message_text || "", type: t };
};

const EMOJIS = [
  "😀", "😄", "😁", "😂", "🙂", "😉", "😊", "😍", "😘", "🤗",
  "🤔", "😴", "😎", "😢", "😭", "😡", "👍", "👎", "👏", "🙏",
  "💪", "👋", "🔥", "✨", "🎉", "❤️", "✅", "❌", "⚠️", "🧹",
];

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-800 ${className}`} />
);

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({
  src,
  type,
  onClose,
}: {
  src: string;
  type: "image" | "video";
  onClose: () => void;
}) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        title="Close"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Media — stop propagation so clicking it doesn't close */}
      <div
        className="max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {type === "video" ? (
          <video
            src={src}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[90vh] object-contain bg-black"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt="Attachment"
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        )}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function MessagesPage({ onClose, initialConversationId }: MessagePageProps) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;

  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; type: "image" | "video" } | null>(null);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedActiveId = useRef(false);
  const hasProcessedInitialConversationId = useRef(false);

  // ── data fetching ──────────────────────────────────────────────────────────

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

  // ── data fetching ──────────────────────────────────────────────────────────

  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useGetConversationsQuery(
    { userId: userId || "" },
    { skip: !userId, pollingInterval: 5000 }
  );

  const conversations = useMemo(() => conversationsData?.data || [], [conversationsData?.data]);

  const getInitialActiveId = useCallback((): string | null => {
    if (conversations.length === 0) return null;
    if (initialConversationId) {
      const exists = conversations.some((c: Conversation) => c.id === initialConversationId);
      if (exists) return initialConversationId;
    }
    return conversations[0]?.id || null;
  }, [conversations, initialConversationId]);

  const [activeId, setActiveId] = useState<string | null>(null);

  // Initialize activeId once when conversations are loaded
  useEffect(() => {
    if (conversations.length > 0 && !hasInitializedActiveId.current) {
      const id = getInitialActiveId();
      if (id !== activeId) setActiveId(id);
      hasInitializedActiveId.current = true;
    }
  }, [conversations.length, activeId, getInitialActiveId]);

  // Update activeId when initialConversationId changes
  useEffect(() => {
    if (initialConversationId && conversations.length > 0 && !hasProcessedInitialConversationId.current) {
      const exists = conversations.some((c: Conversation) => c.id === initialConversationId);
      if (exists && initialConversationId !== activeId) setActiveId(initialConversationId);
      hasProcessedInitialConversationId.current = true;
    }
  }, [initialConversationId, conversations, activeId]);

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useGetMessagesQuery(
    { conversationId: activeId || "" },
    { skip: !activeId, pollingInterval: 3000 }
  );

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
      if (emp?.id && emp?.profile_image_url) map[emp.id] = emp.profile_image_url;
    });
    return map;
  }, [employees]);

  // employee id → role string. Drives the role filter — conversations whose
  // OTHER participant has the chosen role pass through; guest conversations
  // are matched via type==='guest'.
  const employeeRoleById = useMemo(() => {
    const map: Record<string, string> = {};
    employees.forEach((emp: Employee) => {
      if (emp?.id && emp?.role) map[emp.id] = emp.role;
    });
    return map;
  }, [employees]);

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  // ── side-effects ───────────────────────────────────────────────────────────

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (activeId && userId) markAsRead({ conversation_id: activeId, user_id: userId });
  }, [activeId, userId, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── helpers (memoised) ─────────────────────────────────────────────────────

  const getConversationDisplayName = useCallback(
    (conversation: Conversation | undefined | null) => {
      if (!conversation) return "";
      if (conversation.type === "guest") return conversation.name;
      const otherIds = (conversation.participant_ids || []).filter((id: string) => id !== userId);
      const names = otherIds.map((id: string) => employeeMap[id]).filter(Boolean);
      return names.length > 0 ? names.join(", ") : conversation.name;
    },
    [employeeMap, userId]
  );

  const memoizedFormatTime = useCallback((ts: string) => formatTime(ts), []);
  const memoizedFormatMessageTime = useCallback((ts: string) => formatMessageTime(ts), []);
  const memoizedGetActiveStatus = useCallback(
    (t: string | undefined, type: string) => getActiveStatus(t, type),
    []
  );

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? conversations[0],
    [activeId, conversations]
  );

  const activeConversationName = getConversationDisplayName(activeConversation);
  const activeConversationOtherParticipantIds = userId
    ? (activeConversation?.participant_ids || []).filter((id: string) => id !== userId)
    : activeConversation?.participant_ids || [];
  const activeConversationAvatarUrl =
    activeConversation?.type !== "guest" && activeConversationOtherParticipantIds.length === 1
      ? employeeProfileImageById[activeConversationOtherParticipantIds[0]]
      : undefined;

  const showSkeletonConversations = isLoadingConversations && conversations.length === 0;
  const showSkeletonMessages = isLoadingMessages && messages.length === 0;

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    return conversations.filter((c: Conversation) => {
      // Role filter first — cheaper check.
      if (roleFilter !== "all") {
        if (roleFilter === "Guest") {
          if (c.type !== "guest") return false;
        } else {
          if (c.type === "guest") return false;
          const otherIds = (c.participant_ids || []).filter((id) => id !== userId);
          const hasRole = otherIds.some((id) => employeeRoleById[id] === roleFilter);
          if (!hasRole) return false;
        }
      }

      if (!term) return true;
      return (
        c.name?.toLowerCase().includes(term) ||
        c.last_message?.toLowerCase().includes(term) ||
        c.type.toLowerCase().includes(term)
      );
    });
  }, [search, conversations, roleFilter, employeeRoleById, userId]);

  // ── image / video attachment ───────────────────────────────────────────────

  const handleImageIconClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so the same file can be re-selected later
    e.target.value = "";
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Only image and video files are supported.");
      return;
    }

    const maxBytes = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`${isVideo ? "Video" : "Image"} must be smaller than ${isVideo ? 50 : 10} MB.`);
      return;
    }

    // Upload to Cloudinary; the message stores just the URL (keeps the 3s poll light).
    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/messages/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.url) {
        throw new Error(data?.error || "Upload failed");
      }
      setAttachedMedia({ url: data.url, type: isVideo ? "video" : "image" });
    } catch (err) {
      console.error("Media upload failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload file.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const removeAttachedMedia = () => setAttachedMedia(null);

  // ── send ───────────────────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    const text = draft.trim();
    if (!text && !attachedMedia) return;
    if (!activeId || !userId) return;
    if (isUploadingMedia) return;

    try {
      await sendMessage({
        conversation_id: activeId,
        sender_id: userId,
        sender_name: session?.user?.name || "Cleaner",
        message_text: attachedMedia?.url || text,
      }).unwrap();

      setDraft("");
      setAttachedMedia(null);
      refetchMessages();
      refetchConversations();

      toast.success("Message sent!");
    } catch (error: unknown) {
      console.error("Failed to send message:", error);
      const msg =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : "Failed to send message";
      toast.error(msg || "Failed to send message");
    }
  };

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

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <Lightbox src={lightbox.src} type={lightbox.type} onClose={() => setLightbox(null)} />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="animate-in fade-in duration-700">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Messages</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              Review and respond to guest and internal chat updates.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr]">

            {/* ── Conversation list ── */}
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

              <div className="p-4 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Messenger"
                    className="w-full pl-10 pr-3 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/30"
                  />
                </div>
                <select
                  aria-label="Filter conversations by role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                  className="w-full px-3 py-2 rounded-full text-sm bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/30"
                >
                  {ROLE_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
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
                      : c.participant_ids || [];
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
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-primary to-brand-primaryDark text-white font-bold flex items-center justify-center">
                            {avatarUrl ? (
                              <Image
                                src={avatarUrl}
                                alt={conversationName || c.name || "Conversation"}
                                width={44}
                                height={44}
                                className="w-11 h-11 rounded-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
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

            {/* ── Chat panel ── */}
            <div className={`bg-white dark:bg-gray-900 flex flex-col h-[calc(100vh-180px)] sm:h-[65vh] lg:h-[72vh] ${showMobileChat ? "flex" : "hidden lg:flex"}`}>
              {activeConversation ? (
                <>
                  {/* Header */}
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
                              (e.target as HTMLImageElement).style.display = "none";
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
                    {/* Facebook Messenger link removed for admin panel */}
                  </div>

                  {/* Messages */}
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
                            <div
                              className={`max-w-[85%] sm:max-w-[75%] ${
                                isMe ? "items-end" : "items-start"
                              } flex flex-col gap-0.5 sm:gap-1`}
                            >
                              {!isMe && senderLabel && (
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
                                  {senderLabel}
                                </span>
                              )}

                              {(() => {
                                const media = getMessageMedia(m);
                                // Caption: text alongside an attachment, but not the media URL itself.
                                const caption =
                                  media && m.message_text && m.message_text !== media.src
                                    ? m.message_text
                                    : null;
                                const captionBubble = caption && (
                                  <div
                                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                                      isMe
                                        ? "bg-brand-primary text-white rounded-br-md"
                                        : "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-bl-md"
                                    }`}
                                  >
                                    {caption}
                                  </div>
                                );
                                if (media?.type === "image") {
                                  return (
                                    <>
                                      <div
                                        className="relative group cursor-zoom-in rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700"
                                        onClick={() => setLightbox({ src: media.src, type: "image" })}
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={media.src}
                                          alt="Attachment"
                                          className="max-w-[220px] sm:max-w-[280px] max-h-[220px] object-cover rounded-2xl transition-opacity group-hover:opacity-90"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-2xl">
                                          <ZoomIn className="w-7 h-7 text-white drop-shadow" />
                                        </div>
                                      </div>
                                      {captionBubble}
                                    </>
                                  );
                                }
                                if (media?.type === "video") {
                                  return (
                                    <>
                                      <div
                                        className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 bg-black"
                                        onClick={() => setLightbox({ src: media.src, type: "video" })}
                                      >
                                        <video
                                          src={media.src}
                                          muted
                                          playsInline
                                          preload="metadata"
                                          className="max-w-[220px] sm:max-w-[280px] max-h-[220px] object-cover rounded-2xl"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors rounded-2xl">
                                          <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                            <Play className="w-6 h-6 text-brand-primary fill-brand-primary ml-0.5" />
                                          </span>
                                        </div>
                                      </div>
                                      {captionBubble}
                                    </>
                                  );
                                }
                                return (
                                  <div
                                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                                      isMe
                                        ? "bg-brand-primary text-white rounded-br-md"
                                        : "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-bl-md"
                                    }`}
                                  >
                                    {m.message_text}
                                  </div>
                                );
                              })()}

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

                  {/* Input area */}
                  <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2 sm:px-4 py-2 sm:py-3">
                    {/* Uploading indicator */}
                    {isUploadingMedia && (
                      <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                        Uploading…
                      </div>
                    )}

                    {/* Attachment preview strip (image or video) */}
                    {attachedMedia && !isUploadingMedia && (
                      <div className="mb-2 flex items-start gap-2">
                        <div className="relative group">
                          {attachedMedia.type === "video" ? (
                            <div
                              className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer bg-black relative"
                              onClick={() => setLightbox({ src: attachedMedia.url, type: "video" })}
                            >
                              <video src={attachedMedia.url} muted playsInline preload="metadata" className="w-16 h-16 object-cover" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="w-5 h-5 text-white fill-white" />
                              </div>
                            </div>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={attachedMedia.url}
                              alt="Attachment preview"
                              className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shadow-sm cursor-zoom-in"
                              onClick={() => setLightbox({ src: attachedMedia.url, type: "image" })}
                            />
                          )}
                          <button
                            type="button"
                            onClick={removeAttachedMedia}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow"
                            title="Remove attachment"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setIsNewMessageModalOpen(true)}
                        className="p-1.5 sm:p-2 rounded-full hover:bg-brand-primaryLighter transition-colors hidden sm:block"
                        title="New message"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                      </button>

                      {/* Photo / video attach button */}
                      <button
                        type="button"
                        onClick={handleImageIconClick}
                        disabled={isUploadingMedia}
                        className="p-1.5 sm:p-2 rounded-full hover:bg-brand-primaryLighter transition-colors disabled:opacity-50"
                        title="Attach photo or video"
                      >
                        {isUploadingMedia ? (
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary animate-spin" />
                        ) : (
                          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                        )}
                      </button>

                      {/* Emoji picker */}
                      <div className="relative" ref={emojiPickerRef}>
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker((p) => !p)}
                          className="p-1.5 sm:p-2 rounded-full hover:bg-brand-primaryLighter transition-colors"
                          title="Emoji"
                        >
                          <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                        </button>
                        {showEmojiPicker && (
                          <div className="absolute bottom-full left-0 mb-2 w-56 sm:w-64 p-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 grid grid-cols-6 gap-1">
                            {EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleEmojiSelect(emoji)}
                                className="text-xl rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 p-1 transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

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
                      </div>

                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={isSending || isUploadingMedia || (!draft.trim() && !attachedMedia)}
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
    </>
  );
}
