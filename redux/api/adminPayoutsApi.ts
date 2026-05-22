import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { PartnerPayout, PartnerPayoutItem } from "./partnerSelfApi";

export type PayoutStatus = "pending" | "processing" | "paid" | "failed" | "cancelled";

export interface AdminPayoutRow extends PartnerPayout {
  partner_id: string;
  partner_fullname: string | null;
  partner_email: string | null;
  item_count: number;
}

export interface AdminPayoutDetail extends AdminPayoutRow {
  items: PartnerPayoutItem[];
}

export interface GeneratePayoutBody {
  // Direct payment record — no booking derivation. Just what the owner
  // actually transferred to the partner.
  partner_id: string;
  amount: number;
  payment_date: string;          // YYYY-MM-DD
  payment_method?: string;
  payment_destination?: string;
  reference_number?: string;
  proof_data_url?: string;       // single primary receipt (data URL)
  notes?: string;
}

export interface UpdatePayoutBody {
  id: string;
  action: "mark_processing" | "mark_paid" | "mark_failed" | "cancel";
  proof_data_url?: string;
  reference_number?: string;
  reviewer_notes?: string;
  scheduled_date?: string;
}

export interface HavenCommission {
  haven_id: string;
  haven_name?: string;
  partner_id?: string;
  commission_type: "percentage" | "fixed_daily" | "fixed_commission" | "hybrid" | null;
  partner_share_pct: number | null;
  platform_share_pct: number | null;
  fixed_daily_guarantee: number | null;
  fixed_commission: number | null;
  cleaning_fee_share_pct: number | null;
  payment_schedule: "weekly" | "biweekly" | "monthly" | "per_booking" | null;
  default_commission_type?: string | null;
  default_partner_share_pct?: number | null;
  default_platform_share_pct?: number | null;
  default_fixed_daily_guarantee?: number | null;
  default_fixed_commission?: number | null;
  default_cleaning_fee_share_pct?: number | null;
  default_payment_schedule?: string | null;
}

interface ApiOk<T> {
  success: true;
  data: T;
  counts?: Record<string, number>;
}

interface AdminListResponse {
  rows: AdminPayoutRow[];
  counts: Record<string, number>;
}

export const adminPayoutsApi = createApi({
  reducerPath: "adminPayoutsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/admin" }),
  tagTypes: ["AdminPayouts", "HavenCommission"],
  endpoints: (builder) => ({
    getAdminPayouts: builder.query<
      AdminListResponse,
      { status?: PayoutStatus | "all"; partner_id?: string } | void
    >({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params?.status) qs.set("status", params.status);
        if (params?.partner_id) qs.set("partner_id", params.partner_id);
        const s = qs.toString();
        return `/partner-payouts${s ? `?${s}` : ""}`;
      },
      transformResponse: (res: ApiOk<AdminPayoutRow[]>) => ({
        rows: res.data,
        counts: res.counts || {},
      }),
      providesTags: ["AdminPayouts"],
    }),

    getAdminPayout: builder.query<AdminPayoutDetail, string>({
      query: (id) => `/partner-payouts/${id}`,
      transformResponse: (res: ApiOk<AdminPayoutDetail>) => res.data,
      providesTags: (_r, _e, id) => [{ type: "AdminPayouts", id }],
    }),

    generatePayout: builder.mutation<AdminPayoutRow, GeneratePayoutBody>({
      query: (body) => ({
        url: `/partner-payouts`,
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiOk<AdminPayoutRow>) => res.data,
      invalidatesTags: ["AdminPayouts"],
    }),

    updatePayout: builder.mutation<PartnerPayout, UpdatePayoutBody>({
      query: ({ id, ...body }) => ({
        url: `/partner-payouts/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: ApiOk<PartnerPayout>) => res.data,
      invalidatesTags: ["AdminPayouts"],
    }),

    // Commission config per haven
    getHavenCommission: builder.query<HavenCommission, string>({
      query: (havenId) => `/haven-commission/${havenId}`,
      transformResponse: (res: ApiOk<HavenCommission>) => res.data,
      providesTags: (_r, _e, havenId) => [{ type: "HavenCommission", id: havenId }],
    }),

    setHavenCommission: builder.mutation<HavenCommission, { havenId: string } & Partial<HavenCommission>>({
      query: ({ havenId, ...body }) => ({
        url: `/haven-commission/${havenId}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: ApiOk<HavenCommission>) => res.data,
      invalidatesTags: (_r, _e, arg) => [{ type: "HavenCommission", id: arg.havenId }],
    }),
  }),
});

export const {
  useGetAdminPayoutsQuery,
  useGetAdminPayoutQuery,
  useGeneratePayoutMutation,
  useUpdatePayoutMutation,
  useGetHavenCommissionQuery,
  useSetHavenCommissionMutation,
} = adminPayoutsApi;
