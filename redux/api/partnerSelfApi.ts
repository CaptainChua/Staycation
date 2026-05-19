import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface PartnerListing {
  uuid_id: string;
  haven_name: string;
  tower?: string;
  floor?: string;
  view_type?: string;
  capacity?: number;
  room_size?: number;
  beds?: string;
  description?: string;
  weekday_rate?: number;
  weekend_rate?: number;
  ten_hour_rate?: number;
  six_hour_rate?: number;
  status?: string;
  rejection_reason?: string | null;
  reviewer_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  bookings_count?: number;
  images?: Array<{ id?: string; image_url?: string; is_main?: boolean }>;
}

export interface PartnerBooking {
  booking_uuid: string;
  booking_id: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  status: string;
  adults: number;
  children: number;
  infants: number;
  created_at: string;
  haven_id: string;
  gross: number;
  commission: number;
  fee: number;
  net: number;
}

export interface PartnerAnalytics {
  days: number;
  active_listings: number;
  total_bookings: number;
  lifetime_completed_bookings: number;
  gross_total: number;
  net_total: number;
  commission_rate: number;
  occupancy: number;
  booked_nights: number;
  available_nights: number;
  bookings_by_room: { room: string; bookings: number; net: number }[];
  revenue_series: { label: string; gross: number; net: number }[];
}

export interface PartnerPayout {
  id: string;
  cycle_start: string;
  cycle_end: string;
  scheduled_date: string;
  paid_at: string | null;
  gross_amount: number;
  commission_amount: number;
  processing_fee: number;
  net_amount: number;
  payment_method: string;
  reference_number: string | null;
  status: "pending" | "processing" | "paid" | "failed" | "cancelled";
  notes: string | null;
}

export interface PartnerPayoutSummary {
  commission_rate: number;
  total_earnings: number;
  total_paid: number;
  pending_amount: number;
  next_payout_date: string | null;
  payouts: PartnerPayout[];
}

export interface PartnerMessage {
  id: string;
  sender: "partner" | "staff";
  sender_name: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface PartnerMessageThread {
  id: string;
  thread_key: string;
  display_name: string;
  role_label: string | null;
  avatar_initials: string | null;
  avatar_color: string | null;
  last_message_preview: string | null;
  last_message_at: string;
  unread_count: number;
  is_online: boolean;
  messages: PartnerMessage[];
}

export interface PartnerNotification {
  id: string;
  kind: "info" | "review" | "rejected" | "approved" | "payout" | "message";
  title: string;
  body: string;
  related_haven_id: string | null;
  related_booking_id: string | null;
  related_payout_id: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface PartnerProfile {
  id: string;
  email: string;
  status: string;
  last_login: string | null;
  joined_at: string;
  fullname: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  type: string | null;
  commission_rate: number | null;
  total_earnings: number | null;
  total_paid: number | null;
  profile_image_url: string | null;
  availability_status: string | null;
}

export interface UpdateProfilePayload {
  fullname?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  profile_image_url?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

interface ApiOk<T> {
  success: true;
  data: T;
}

export const partnerSelfApi = createApi({
  reducerPath: "partnerSelfApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/partners/me" }),
  tagTypes: ["Listings", "Bookings", "Analytics", "Payouts", "Messages", "Notifications", "Profile"],
  endpoints: (builder) => ({
    getMyListings: builder.query<PartnerListing[], void>({
      query: () => "/listings",
      transformResponse: (res: ApiOk<PartnerListing[]>) => res.data,
      providesTags: ["Listings"],
    }),
    getMyBookings: builder.query<PartnerBooking[], { limit?: number; status?: string } | void>({
      query: (params) => ({ url: "/bookings", params: params || {} }),
      transformResponse: (res: ApiOk<PartnerBooking[]>) => res.data,
      providesTags: ["Bookings"],
    }),
    getMyAnalytics: builder.query<PartnerAnalytics, { days?: number } | void>({
      query: (params) => ({ url: "/analytics", params: params || {} }),
      transformResponse: (res: ApiOk<PartnerAnalytics>) => res.data,
      providesTags: ["Analytics"],
    }),
    getMyPayouts: builder.query<PartnerPayoutSummary, void>({
      query: () => "/payouts",
      transformResponse: (res: ApiOk<PartnerPayoutSummary>) => res.data,
      providesTags: ["Payouts"],
    }),
    getMyMessageThreads: builder.query<PartnerMessageThread[], void>({
      query: () => "/messages",
      transformResponse: (res: ApiOk<PartnerMessageThread[]>) => res.data,
      providesTags: ["Messages"],
    }),
    sendPartnerMessage: builder.mutation<PartnerMessage, { thread_id: string; body: string }>({
      query: (body) => ({ url: "/messages", method: "POST", body }),
      transformResponse: (res: ApiOk<PartnerMessage>) => res.data,
      invalidatesTags: ["Messages"],
    }),
    getMyNotifications: builder.query<PartnerNotification[], { unread?: boolean } | void>({
      query: (params) => ({
        url: "/notifications",
        params: params?.unread ? { unread: "true" } : {},
      }),
      transformResponse: (res: ApiOk<PartnerNotification[]>) => res.data,
      providesTags: ["Notifications"],
    }),
    markNotificationRead: builder.mutation<void, { id?: string; mark_all_read?: boolean }>({
      query: (body) => ({ url: "/notifications", method: "PATCH", body }),
      invalidatesTags: ["Notifications"],
    }),
    getMyProfile: builder.query<PartnerProfile, void>({
      query: () => "/profile",
      transformResponse: (res: ApiOk<PartnerProfile>) => res.data,
      providesTags: ["Profile"],
    }),
    updateMyProfile: builder.mutation<void, UpdateProfilePayload>({
      query: (body) => ({ url: "/profile", method: "PATCH", body }),
      invalidatesTags: ["Profile"],
    }),
    changeMyPassword: builder.mutation<void, ChangePasswordPayload>({
      query: (body) => ({ url: "/password", method: "POST", body }),
    }),
  }),
});

export const {
  useGetMyListingsQuery,
  useGetMyBookingsQuery,
  useGetMyAnalyticsQuery,
  useGetMyPayoutsQuery,
  useGetMyMessageThreadsQuery,
  useSendPartnerMessageMutation,
  useGetMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useChangeMyPasswordMutation,
} = partnerSelfApi;
