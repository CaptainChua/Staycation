import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: "/api",
    credentials: 'include', // Include cookies for NextAuth session
  }),
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    // Get notifications for current user
    getNotifications: builder.query<Notification[], { unreadOnly?: boolean; limit?: number; offset?: number }>({
      query(params = {}) {
        return {
          url: "/notifications",
          params
        };
      },
      transformResponse: (response: { success: boolean; data: Notification[] }) => {
        return response.data || [];
      },
      providesTags: ['Notification']
    }),

    // Mark notifications as read/unread
    updateNotifications: builder.mutation<
      { success: boolean; message: string },
      { notificationIds: string[]; markAs: 'read' | 'unread' }
    >({
      query(body) {
        return {
          url: "/notifications",
          method: "PATCH",
          body
        };
      },
      invalidatesTags: ['Notification']
    }),

    // Mark all notifications as read
    markAllAsRead: builder.mutation<{ success: boolean; message: string }, void>({
      queryFn: async (_, { dispatch, getState }) => {
        try {
          // Get current notifications from state
          const state = getState() as any;
          const notifications = state.notificationsApi?.queries?.getNotifications?.data || [];
          
          const unreadIds = notifications
            .filter((n: Notification) => !n.read)
            .map((n: Notification) => n.id);

          if (unreadIds.length === 0) {
            return { data: { success: true, message: 'No unread notifications to mark' } };
          }

          const response = await fetch('/api/notifications', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              notificationIds: unreadIds,
              markAs: 'read'
            })
          });

          if (!response.ok) {
            throw new Error('Failed to mark notifications as read');
          }

          const data = await response.json();
          return { data };
        } catch (error) {
          return { error: { status: 500, data: { message: 'Failed to mark all notifications as read' } } };
        }
      },
      invalidatesTags: ['Notification']
    }),

    // Get unread count
    getUnreadCount: builder.query<number, void>({
      query: () => ({
        url: "/notifications",
        params: { unreadOnly: true, limit: 100 }
      }),
      transformResponse: (response: { success: boolean; data: Notification[] }) => {
        return response.data?.length || 0;
      },
      providesTags: ['Notification']
    })
  })
});

export const {
  useGetNotificationsQuery,
  useUpdateNotificationsMutation,
  useMarkAllAsReadMutation,
  useGetUnreadCountQuery
} = notificationsApi;
