import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface Conversation {
  id: string;
  name: string;
  type: "internal" | "guest" | "oauth";
  participant_ids: string[];
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
}

export const messagesApi = createApi({
  reducerPath: "messagesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/messages" }),
  tagTypes: ["Conversations", "Messages"],
  endpoints: (builder) => ({
    // Get all conversations for a user
    getConversations: builder.query<
      { success: boolean; data: Conversation[] },
      { userId: string }
    >({
      query: ({ userId }) => ({
        url: `/conversations?userId=${userId}`,
        method: "GET",
      }),
      providesTags: ["Conversations"],
    }),

    // Get messages for a specific conversation
    getMessages: builder.query<
      { success: boolean; data: Message[] },
      { conversationId: string }
    >({
      query: ({ conversationId }) => ({
        url: `/${conversationId}`,
        method: "GET",
      }),
      providesTags: (result, error, { conversationId }) => [
        { type: "Messages", id: conversationId },
      ],
    }),

    // Send a message
    sendMessage: builder.mutation<
      { success: boolean; data: Message },
      {
        conversation_id: string;
        sender_id: string;
        sender_name: string;
        message_text: string;
      }
    >({
      query: (body) => ({
        url: "/send",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { conversation_id }) => [
        { type: "Messages", id: conversation_id },
        "Conversations",
      ],
    }),

    // Mark messages as read
    markMessagesAsRead: builder.mutation<
      { success: boolean; message: string },
      { conversation_id: string; user_id: string }
    >({
      query: (body) => ({
        url: "/mark-read",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Conversations"],
    }),

    // Create a new conversation
    createConversation: builder.mutation<
      { success: boolean; data: Conversation },
      {
        name: string;
        type: "internal" | "guest" | "oauth";
        participant_ids: string[];
      }
    >({
      query: (body) => ({
        url: "/conversations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Conversations"],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkMessagesAsReadMutation,
  useCreateConversationMutation,
} = messagesApi;
