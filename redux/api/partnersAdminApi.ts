import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface PartnersOverview {
  partners: { total: number; active: number; pending: number; suspended: number };
  havens: { total: number; pending: number; approved: number; rejected: number };
  bookings: { total: number; completed: number; last_30_days: number; gross_revenue: number };
  financials: {
    partner_earnings: number;
    partner_paid: number;
    platform_commission: number;
    avg_commission_rate: number;
  };
  recent_activity: Array<{
    kind: string;
    title: string;
    partner: string | null;
    at: string;
  }>;
}

export interface PartnerListingRow {
  uuid_id: string;
  haven_name: string;
  tower: string | null;
  floor: string | null;
  view_type: string | null;
  capacity: number | null;
  room_size: number | null;
  beds: string | null;
  description: string | null;
  youtube_url: string | null;
  weekday_rate: number | null;
  weekend_rate: number | null;
  ten_hour_rate: number | null;
  six_hour_rate: number | null;
  six_hour_check_in: string | null;
  six_hour_check_out: string | null;
  ten_hour_check_in: string | null;
  ten_hour_check_out: string | null;
  twenty_one_hour_check_in: string | null;
  twenty_one_hour_check_out: string | null;
  amenities: Record<string, boolean> | null;
  bathrooms?: number | null;
  property_type?: string | null;
  cleaning_fee?: number | null;
  security_deposit?: number | null;
  extra_pax_fee?: number | null;
  house_rules?: string | null;
  smoking_policy?: string | null;
  pet_policy?: string | null;
  cancellation_policy?: string | null;
  google_map_address?: string | null;
  virtual_tour_url?: string | null;
  listing_status?: "active" | "disabled" | "suspended" | null;
  listing_status_reason?: string | null;
  created_at: string;
  partner_id: string;
  status: "pending" | "approved" | "rejected" | "blocked";
  rejection_reason: string | null;
  reviewer_notes: string | null;
  partner_email: string;
  partner_status: string | null;
  partner_joined_at: string | null;
  partner_name: string | null;
  partner_phone: string | null;
  partner_address: string | null;
  commission_rate: number | null;
  partner_total_earnings: number | null;
  bookings_count: number;
  image_url: string | null;
  images: Array<{ id: number; image_url: string; is_main: boolean }>;
  photo_tour: Array<{ id: number; category: string; image_url: string }>;
}

export interface AdminPartnerThread {
  id: string;
  thread_key: string;
  display_name: string;
  role_label: string | null;
  last_message_preview: string | null;
  last_message_at: string;
  unread_count: number;
  is_online: boolean;
  partner_email: string;
  partner_name: string | null;
  message_count: number;
}

export interface AdminPartnerMessage {
  id: string;
  sender: "partner" | "staff";
  sender_name: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface ApiOk<T> { success: true; data: T; }

export const partnersAdminApi = createApi({
  reducerPath: "partnersAdminApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/admin" }),
  tagTypes: ["Overview", "Listings", "Threads", "ThreadMessages"],
  endpoints: (builder) => ({
    getPartnersOverview: builder.query<PartnersOverview, { partner_id?: string } | void>({
      query: (params) => ({ url: "/partners-overview", params: params || {} }),
      transformResponse: (res: ApiOk<PartnersOverview>) => res.data,
      providesTags: ["Overview"],
    }),
    getPartnerListings: builder.query<PartnerListingRow[], { status?: string } | void>({
      query: (params) => ({ url: "/partner-listings", params: params || {} }),
      transformResponse: (res: ApiOk<PartnerListingRow[]>) => res.data,
      providesTags: ["Listings"],
    }),
    getPartnerThreads: builder.query<AdminPartnerThread[], void>({
      query: () => "/partner-messages",
      transformResponse: (res: ApiOk<AdminPartnerThread[]>) => res.data,
      providesTags: ["Threads"],
    }),
    getPartnerThreadMessages: builder.query<AdminPartnerMessage[], string>({
      query: (threadId) => `/partner-messages/${threadId}`,
      transformResponse: (res: ApiOk<AdminPartnerMessage[]>) => res.data,
      providesTags: (_, __, threadId) => [{ type: "ThreadMessages", id: threadId }],
    }),
    sendStaffReply: builder.mutation<AdminPartnerMessage, { thread_id: string; body: string; sender_name?: string }>({
      query: (body) => ({ url: "/partner-messages", method: "POST", body }),
      transformResponse: (res: ApiOk<AdminPartnerMessage>) => res.data,
      invalidatesTags: (_, __, arg) => ["Threads", { type: "ThreadMessages", id: arg.thread_id }],
    }),
    // Starts (or reuses) the default 'support' thread for a partner and posts
    // the first staff message. Used by the new-message picker when the Owner
    // selects a partner who doesn't yet have an existing conversation.
    startPartnerThread: builder.mutation<
      AdminPartnerMessage & { thread_id: string },
      { partner_id: string; body: string; sender_name?: string }
    >({
      query: (body) => ({ url: "/partner-messages", method: "POST", body }),
      transformResponse: (res: ApiOk<AdminPartnerMessage & { thread_id: string }>) => res.data,
      invalidatesTags: ["Threads"],
    }),
  }),
});

export const {
  useGetPartnersOverviewQuery,
  useGetPartnerListingsQuery,
  useGetPartnerThreadsQuery,
  useGetPartnerThreadMessagesQuery,
  useSendStaffReplyMutation,
  useStartPartnerThreadMutation,
} = partnersAdminApi;
