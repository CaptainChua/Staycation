"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import Image from "next/image";
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkMessagesAsReadMutation,
  useCreateConversationMutation,
} from "@/redux/api/messagesApi";
import { useGetEmployeesQuery } from "@/redux/api/employeeApi";
import { getGuestName } from "@/lib/guest";
import toast from "react-hot-toast";
import NewMessageModal from "@/Components/admin/Csr/Modals/NewMessageModal";

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

interface Employee {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  employment_id?: string;
  profile_image_url?: string;
}

// Helper functions defined outside of component to avoid conditional hooks
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
    return { isActive: false, statusText: "Offline" };
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

// Skeleton component defined outside of main component
const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-800 ${className}`} />
);

export default function MessagesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;

  // Persistent guest identifier so guests can create conversations and send messages
  // without requiring an account. Stored in localStorage as "guestId".
  const [guestId, setGuestId] = useState<string | null>(null);
  const [guestName] = useState<string | null>(getGuestName());

  useEffect(() => {
    if (userId) {
      // If a user logs in, clear any in-memory guest id (we keep localStorage for continuity)
      // Avoid setting state synchronously inside an effect to prevent cascading renders
      setTimeout(() => setGuestId(null), 0);
      return;
    }
    try {
      let stored = localStorage.getItem("guestId") as string | null;
      if (!stored) {
        // Prefer crypto.randomUUID when available; avoid `any` casts for better typing
        const globalCrypto = (
          globalThis as unknown as { crypto?: { randomUUID?: () => string } }
        ).crypto;
        stored =
          globalCrypto && typeof globalCrypto.randomUUID === "function"
            ? globalCrypto.randomUUID()
            : `guest_${Date.now()}`;
        localStorage.setItem("guestId", stored);
      }
      // Defer setting state to avoid synchronous setState in an effect
      setTimeout(() => setGuestId(stored), 0);
    } catch (err) {
      console.error("Failed to initialize guest id", err);
      // localStorage might not be available in some environments; fallback to ephemeral id
      setTimeout(() => setGuestId(`guest_${Date.now()}`), 0);
    }
  }, [userId]);

  const currentUserId = userId || guestId;

  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [showEmployeeSelection, setShowEmployeeSelection] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasInitializedActiveId = useRef(false);

  // Fetch conversations (using a guest user ID for demo purposes)
  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useGetConversationsQuery(
    { userId: currentUserId || "" }, // Support guest users via a persistent guestId
    { skip: !currentUserId, pollingInterval: 5000 },
  );

  const conversations = useMemo(
    () => conversationsData?.data || [],
    [conversationsData?.data],
  );

  // Fetch CSR employees for selection
  const { data: employeesData } = useGetEmployeesQuery({});
  const employees = useMemo(
    () => employeesData?.data || [],
    [employeesData?.data],
  );

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

  // Filter employees to show only CSRs
  const csrEmployees: Employee[] = useMemo(() => {
    return employees.filter(
      (emp: Employee) =>
        emp.email?.toLowerCase().includes("csr") ||
        emp.employment_id?.toLowerCase().includes("csr"),
    );
  }, [employees]);

  // Compute initial active conversation ID
  const getInitialActiveId = useCallback((): string | null => {
    if (conversations.length === 0) return null;
    return conversations[0]?.id || null;
  }, [conversations]);

  const [activeId, setActiveId] = useState<string | null>(null);

  // Initialize activeId once when conversations are loaded
  useEffect(() => {
    // Only run this effect once when conversations are loaded and we haven't initialized activeId yet
    if (conversations.length > 0 && !hasInitializedActiveId.current) {
      const initialActiveId = getInitialActiveId();
      if (initialActiveId !== activeId) {
        // Use setTimeout to avoid calling setState synchronously within effect
        setTimeout(() => setActiveId(initialActiveId), 0);
      }
      hasInitializedActiveId.current = true;
    }
  }, [conversations.length, getInitialActiveId, activeId]);

  // Fetch messages for active conversation
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useGetMessagesQuery(
    { conversationId: activeId || "" },
    { skip: !activeId, pollingInterval: 3000 },
  );

  // Mutations
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [markAsRead] = useMarkMessagesAsReadMutation();
  const [createConversation] = useCreateConversationMutation();

  const messages = useMemo(
    () => messagesData?.data || [],
    [messagesData?.data],
  );

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (activeId && currentUserId) {
      markAsRead({ conversation_id: activeId, user_id: currentUserId });
    }
  }, [activeId, currentUserId, markAsRead]);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getConversationDisplayName = useCallback(
    (conversation: Conversation | undefined | null) => {
      if (!conversation) return "";

      if (conversation.type === "guest" || conversation.type === "oauth") {
        if (conversation.name) {
          // Conversation names are in format: "UserName • EmployeeName"
          const parts = conversation.name.split(" • ");

          // If current user is the customer (OAuth user or guest), show employee name
          if (conversation.type === "oauth" && session?.user) {
            // OAuth user viewing - show employee name (second part)
            return parts[1] || "Staff";
          } else if (conversation.type === "guest" && !session?.user) {
            // Guest viewing - show employee name (second part)
            return parts[1] || "Staff";
          } else {
            // Staff viewing OAuth/guest conversation - show customer name (first part)
            return (
              parts[0] || (conversation.type === "oauth" ? "User" : "Guest")
            );
          }
        }

        // Fallback for conversations without proper names
        if (conversation.type === "oauth" && session?.user) {
          return "Staff";
        } else if (conversation.type === "guest" && !session?.user) {
          return "Staff";
        } else {
          return conversation.type === "oauth" ? "User" : guestName || "Guest";
        }
      }

      // For internal staff conversations, show other participants' names
      const otherParticipantIds = (conversation.participant_ids || []).filter(
        (id: string) => id !== userId,
      );

      const otherNames = otherParticipantIds
        .map((id: string) => employeeMap[id])
        .filter(Boolean);

      if (otherNames.length > 0) {
        return otherNames.join(", ");
      }

      return conversation.name || "Conversation";
    },
    [employeeMap, userId, guestName, session?.user],
  );

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? conversations[0],
    [activeId, conversations],
  );

  const activeConversationName = getConversationDisplayName(activeConversation);

  // Get avatar URL for active conversation
  const activeConversationAvatarUrl = useMemo(() => {
    if (!activeConversation) return undefined;

    const otherParticipantIds = currentUserId
      ? (activeConversation.participant_ids || []).filter(
          (id: string) => id !== currentUserId,
        )
      : activeConversation.participant_ids || [];

    if (otherParticipantIds.length === 1) {
      return employeeProfileImageById[otherParticipantIds[0]];
    }

    return undefined;
  }, [activeConversation, employeeProfileImageById, currentUserId]);

  const handleNewChatWithEmployee = (employee: Employee) => {
    // Create a new conversation with the selected employee (supports guest users)
    const employeeName =
      `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim();

    const idToUse = currentUserId;
    if (!idToUse) {
      toast.error("Unable to start chat. Please try again.");
      return;
    }

    (async () => {
      try {
        const result = await createConversation({
          name: session?.user
            ? `${session.user.name || "User"} • ${employeeName || employee.email || "Employee"}`
            : `${guestName || "Guest"} • ${employeeName || employee.email || "Employee"}`,
          type: session?.user ? "oauth" : "guest",
          participant_ids: [idToUse, employee.id],
        }).unwrap();

        if (result.data?.id) {
          setActiveId(result.data.id);
          setShowEmployeeSelection(false);
          refetchConversations();
        }
      } catch (error: unknown) {
        console.error("Failed to create conversation:", error);
        const errorMessage =
          error && typeof error === "object" && "data" in error
            ? (error as { data?: { error?: string } }).data?.error
            : "Failed to create conversation";
        toast.error(errorMessage || "Failed to create conversation");
      }
    })();
  };

  const handleSendMessage = async () => {
    const text = draft.trim();
    if (!text || !activeId) return;

    const senderId = currentUserId;
    if (!senderId) {
      toast.error("Unable to send message. Please try again.");
      return;
    }

    try {
      await sendMessage({
        conversation_id: activeId,
        sender_id: senderId,
        sender_name: session?.user?.name || guestName || "Guest",
        message_text: text,
      }).unwrap();

      setDraft("");
      refetchMessages();
      refetchConversations();
    } catch (error: unknown) {
      console.error("Failed to send message:", error);
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : "Failed to send message";
      toast.error(errorMessage || "Failed to send message");
    }
  };

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((c: Conversation) => {
      const conversationName = getConversationDisplayName(c);
      return (
        conversationName?.toLowerCase().includes(term) ||
        (c.last_message && c.last_message.toLowerCase().includes(term)) ||
        c.type.toLowerCase().includes(term)
      );
    });
  }, [search, conversations, getConversationDisplayName]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24 p-4">
      <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Messages
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chat with our customer service team
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Go back"
            type="button"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr]">
            {/* Conversations Sidebar */}
            <div className="border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-[calc(100vh-180px)] sm:h-[65vh] lg:h-[72vh]">
              <div className="h-14 sm:h-16 px-3 sm:px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Chats
                </p>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmployeeSelection(true)}
                    className="p-2 rounded-full hover:bg-brand-primaryLighter transition-colors"
                    title="New message"
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
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
                  <div className="flex flex-col gap-3 p-4">
                    <Skeleton className="h-16 rounded-lg" />
                    <Skeleton className="h-16 rounded-lg" />
                    <Skeleton className="h-16 rounded-lg" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex items-center justify-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">
                      No conversations found
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((c) => {
                    const isActive = c.id === activeId;
                    const conversationName = getConversationDisplayName(c);
                    const activeStatus = getActiveStatus(
                      c.last_message_time,
                      c.type,
                    );
                    const otherParticipantIds = currentUserId
                      ? (c.participant_ids || []).filter(
                          (id: string) => id !== currentUserId,
                        )
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
                          setShowEmployeeSelection(false);
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
                                alt={
                                  conversationName || c.name || "Conversation"
                                }
                                width={44}
                                height={44}
                                className="w-11 h-11 rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
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
                              {c.last_message_time
                                ? formatTime(c.last_message_time)
                                : ""}
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

            {/* Chat Area or Employee Selection */}
            <div className="bg-white dark:bg-gray-900 flex flex-col h-[calc(100vh-180px)] sm:h-[65vh] lg:h-[72vh]">
              {showEmployeeSelection ? (
                <div className="h-full flex flex-col">
                  <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                      Start New Chat
                    </p>

                    <button
                      onClick={() => setShowEmployeeSelection(false)}
                      className="p-2 rounded-full hover:bg-brand-primaryLighter transition-colors"
                      title="Cancel"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    <p className="text-center text-gray-500 dark:text-gray-400 mb-4">
                      Select a customer service representative to start a
                      conversation
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {csrEmployees.map((employee: Employee) => (
                        <button
                          key={employee.id}
                          onClick={() => handleNewChatWithEmployee(employee)}
                          className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-brand-primary hover:shadow-md transition-all duration-200 group"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-brand-primaryDark text-white font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                              {employee.profile_image_url ? (
                                <Image
                                  src={employee.profile_image_url}
                                  alt={`${employee.first_name} ${employee.last_name}`}
                                  width={64}
                                  height={64}
                                  className="w-16 h-16 object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span className="text-lg">
                                  {(employee.first_name || "")[0] ||
                                    (employee.last_name || "")[0] ||
                                    "?"}
                                </span>
                              )}
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {employee.first_name} {employee.last_name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Customer Service Representative
                              </p>
                              {employee.email && (
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  {employee.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activeConversation ? (
                <>
                  {/* Active Conversation Header */}
                  <div className="h-14 sm:h-16 px-2 sm:px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-primaryDark text-white font-bold flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {activeConversationAvatarUrl ? (
                          <Image
                            src={activeConversationAvatarUrl}
                            alt={
                              activeConversationName ||
                              activeConversation.name ||
                              "Conversation"
                            }
                            width={40}
                            height={40}
                            className="w-10 h-10 object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        ) : (
                          (
                            activeConversationName ||
                            activeConversation.name ||
                            "?"
                          )
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                          {activeConversationName || activeConversation.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {
                            getActiveStatus(
                              activeConversation.last_message_time,
                              activeConversation.type,
                            ).statusText
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="p-2 rounded-full hover:bg-brand-primaryLighter transition-colors"
                        title="Call"
                      >
                        <Phone className="w-5 h-5 text-brand-primary" />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-full hover:bg-brand-primaryLighter transition-colors"
                        title="Video"
                      >
                        <Video className="w-5 h-5 text-brand-primary" />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-full hover:bg-brand-primaryLighter transition-colors"
                        title="Info"
                      >
                        <Info className="w-5 h-5 text-brand-primary" />
                      </button>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 px-2 sm:px-4 py-3 sm:py-4 space-y-2 sm:space-y-3">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 dark:text-gray-400">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    ) : (
                      <>
                        {messages.map((m: Message) => {
                          const isMe = m.sender_id === currentUserId;
                          const senderLabel = !isMe
                            ? employeeMap[m.sender_id] ||
                              m.sender_name ||
                              "Staff"
                            : undefined;

                          return (
                            <div
                              key={m.id}
                              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[85%] sm:max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5 sm:gap-1`}
                              >
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
                                <span className="text-[10px] sm:text-[11px] text-gray-400">
                                  {formatMessageTime(m.created_at)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        type="button"
                        className="p-2 rounded-full hover:bg-brand-primaryLighter transition-colors"
                        title="Attach"
                      >
                        <ImageIcon className="w-5 h-5 text-brand-primary" />
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
                        <button
                          type="button"
                          className="p-2 rounded-full hover:bg-brand-primaryLighter transition-colors"
                          title="Emoji"
                        >
                          <Smile className="w-5 h-5 text-brand-primary" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={isSending || !draft.trim()}
                        className="p-2 rounded-full hover:bg-brand-primaryLighter transition-colors disabled:opacity-50"
                        title="Send"
                      >
                        {isSending ? (
                          <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
                        ) : (
                          <Send className="w-5 h-5 text-brand-primary" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a conversation to start messaging
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Message Modal */}
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
    </div>
  );
}
