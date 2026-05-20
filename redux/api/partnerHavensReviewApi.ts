import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface PartnerHavenSubmission {
  uuid_id: string;
  haven_name: string;
  tower?: string;
  floor?: string;
  view_type?: string;
  capacity?: number;
  room_size?: number;
  beds?: string;
  description?: string;
  youtube_url?: string | null;
  weekday_rate?: number;
  weekend_rate?: number;
  ten_hour_rate?: number;
  six_hour_rate?: number;
  six_hour_check_in?: string | null;
  six_hour_check_out?: string | null;
  ten_hour_check_in?: string | null;
  ten_hour_check_out?: string | null;
  twenty_one_hour_check_in?: string | null;
  twenty_one_hour_check_out?: string | null;
  amenities?: Record<string, boolean> | null;
  created_at: string;
  partner_id: string;
  partner_email: string;
  partner_name: string | null;
  partner_phone?: string | null;
  partner_address?: string | null;
  partner_joined_at?: string;
  partner_status?: string;
  partner_commission_rate?: number | null;
  partner_total_earnings?: number | null;
  partner_total_havens?: number;
  partner_approved_havens?: number;
  partner_rejected_havens?: number;
  approval_id: string;
  status: "pending" | "approved" | "blocked" | "rejected";
  reason: string | null;
  reviewer_notes: string | null;
  images: Array<{ id: number; image_url: string; is_main: boolean }>;
  photo_tour: Array<{ id: number; category: string; image_url: string }>;
}

interface ApiOk<T> { success: true; data: T; }

export const partnerHavensReviewApi = createApi({
  reducerPath: "partnerHavensReviewApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/admin/partner-havens" }),
  tagTypes: ["PartnerSubmissions"],
  endpoints: (builder) => ({
    getPartnerSubmissions: builder.query<PartnerHavenSubmission[], { status?: string } | void>({
      query: (params) => ({ url: "", params: params || { status: "pending" } }),
      transformResponse: (res: ApiOk<PartnerHavenSubmission[]>) => res.data,
      providesTags: ["PartnerSubmissions"],
    }),
    reviewPartnerHaven: builder.mutation<
      PartnerHavenSubmission,
      { haven_id: string; action: "approve" | "reject"; reason?: string; reviewer_notes?: string }
    >({
      query: (body) => ({ url: "", method: "PATCH", body }),
      transformResponse: (res: ApiOk<PartnerHavenSubmission>) => res.data,
      invalidatesTags: ["PartnerSubmissions"],
    }),
  }),
});

export const { useGetPartnerSubmissionsQuery, useReviewPartnerHavenMutation } = partnerHavensReviewApi;
