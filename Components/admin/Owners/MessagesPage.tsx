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
  Users,
  MessageCircle,
  Loader2,
} from "lucide-react";
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkMessagesAsReadMutation,
} from "@/redux/api/messagesApi";
import toast from "react-hot-toast";
import NewMessageModal from "./Modals/NewMessageModal";

interface Conversation {
  id: string;
  name?: string;
  type: string;
  participant_ids?: string[];
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;

  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useGetConversationsQuery(
    { userId: userId || "" },
    { skip: !userId, pollingInterval: 5000 } // Poll every 5 seconds for new messages
  );

  const conversations = useMemo(() => conversationsData?.data || [], [conversationsData?.data]);

  // Set the first conversation as active if none is selected
  const effectiveActiveId = useMemo(() => {
    if (activeId) return activeId;
    if (conversations.length > 0) return conversations[0].id;
    return null;
  }, [activeId, conversations]);

  // Fetch messages for active conversation
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useGetMessagesQuery(
    { conversationId: effectiveActiveId || "" },
    { skip: !effectiveActiveId, pollingInterval: 3000 } // Poll every 3 seconds
  );

  // Mutations
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [markAsRead] = useMarkMessagesAsReadMutation();

  const messages = useMemo(() => messagesData?.data || [], [messagesData?.data]);

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (effectiveActiveId && userId) {
      markAsRead({ conversation_id: effectiveActiveId, user_id: userId });
    }
  }, [effectiveActiveId, userId, markAsRead]);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === effectiveActiveId),
    [effectiveActiveId, conversations]
  );

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
    if (!text || !effectiveActiveId || !userId) return;

    try {
      await sendMessage({
        conversation_id: effectiveActiveId,
        sender_id: userId,
        sender_name: session?.user?.name || "Owner",
        message_text: text,
      }).unwrap();

      setDraft("");
      // Refetch to get the latest messages
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
      return { isActive: false, statusText: type === "internal" ? "Offline" : "Guest Inquiry" };
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

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0
  );

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center h-[75vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header - Matching Analytics page style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Messages & Communications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect with staff teams, departments, and guests</p>
        </div>
      </div>

      {/* Main Chat Interface - Matching Analytics page table style */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr]">
          {/* Conversations List */}
          <div className="border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-[75vh]">
            {/* Conversations Header */}
            <div className="h-16 px-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                All Conversations
              </p>
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() => setIsNewMessageModalOpen(true)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="New message"
                >
                  <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((c) => {
                const isActive = c.id === effectiveActiveId;
                const activeStatus = getActiveStatus(c.last_message_time, c.type);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={`w-full px-4 py-3.5 flex items-center gap-3 text-left transition-all ${
                      isActive
                        ? "bg-gray-50 dark:bg-gray-700 border-l-4 border-brand-primary"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-brand-primary text-white font-bold flex items-center justify-center shadow-md">
                        {c.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      {activeStatus.isActive && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isActive ? "text-brand-primary dark:text-brand-primaryLight" : "text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {c.name}
                        </p>
                        <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                        <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {c.last_message_time
                            ? formatTime(c.last_message_time)
                            : ""}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                        {activeStatus.statusText}
                      </p>
                      <p
                        className={`text-xs truncate ${
                          (c.unread_count || 0) > 0
                            ? "text-gray-700 dark:text-gray-300 font-medium"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {c.last_message || "No messages yet"}
                      </p>
                    </div>

                    {(c.unread_count || 0) > 0 && (
                      <div className="w-6 flex justify-end">
                        <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-brand-primary text-white text-xs font-bold shadow-sm">
                          {c.unread_count}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}

              {filteredConversations.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No conversations found</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="bg-white dark:bg-gray-800 flex flex-col h-[75vh]">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 sticky top-0 z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-brand-primary text-white font-bold flex items-center justify-center flex-shrink-0 shadow-md">
                      {activeConversation.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                        {activeConversation.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                        {getActiveStatus(activeConversation.last_message_time, activeConversation.type).isActive && (
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                        )}
                        {getActiveStatus(activeConversation.last_message_time, activeConversation.type).statusText}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="Call"
                    >
                      <Phone className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="Video Call"
                    >
                      <Video className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="Info"
                    >
                      <Info className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                </div>

                {/* Messages Thread */}
                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 px-4 py-4 space-y-3">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((m: Message) => {
                      const isMe = m.sender_id === userId;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] ${
                              isMe ? "items-end" : "items-start"
                            } flex flex-col gap-1`}
                          >
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                isMe
                                  ? "bg-brand-primary text-white rounded-br-md"
                                  : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-bl-md"
                              }`}
                            >
                              {m.message_text}
                            </div>
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 px-1">
                              {formatMessageTime(m.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3">
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Add"
                    >
                      <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Attach Image"
                    >
                      <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 flex items-center gap-2 border border-gray-200 dark:border-gray-600 focus-within:bg-white dark:focus-within:bg-gray-600 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primaryLighter transition-all">
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isSending) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        disabled={isSending}
                        className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                      <button
                        type="button"
                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Emoji"
                      >
                        <Smile className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={isSending || !draft.trim()}
                      className="p-2.5 rounded-full bg-brand-primary hover:bg-brand-primaryDark transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Send"
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Send className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-center p-8">
                <div>
                  <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
                    Select a conversation
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
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
          // Set the new conversation as active
          setActiveId(conversationId);
          // Refetch conversations to show the new one
          refetchConversations();
        }}
      />
    </div>
  );
}