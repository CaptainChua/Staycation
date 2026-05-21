import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type PartnerStatus = "pending" | "active" | "suspended" | "rejected" | "inactive";

export interface PartnerRegistration {
  id: string;
  partner_email: string;
  status: PartnerStatus;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  partner_fullname: string | null;
  partner_phone: string | null;
  business_name: string | null;
  partner_address: string | null;
  partner_city: string | null;
  partner_province: string | null;
  partner_postal_code: string | null;
  valid_id_url: string | null;
  valid_id_type: string | null;
  contract_url: string | null;
  contract_signed_at: string | null;
  gcash_number: string | null;
  gcash_holder_name: string | null;
  maya_number: string | null;
  maya_holder_name: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  tax_id: string | null;
  tax_registered_name: string | null;
  docs_submitted_at: string | null;
  checklist: {
    basic_info: boolean;
    address: boolean;
    valid_id: boolean;
    contract: boolean;
    payout: boolean;
  };
  ready_for_review: boolean;
  missing: string[];
}

export interface AdminPartnerRow extends Omit<PartnerRegistration, "checklist" | "ready_for_review" | "missing"> {
  last_login: string | null;
  created_at: string;
  profile_image_url: string | null;
  havens_count: number;
}

interface ApiOk<T> {
  success: true;
  data: T;
  counts?: Record<string, number>;
}

interface AdminListResponse {
  rows: AdminPartnerRow[];
  counts: Record<string, number>;
}

export const partnerRegistrationApi = createApi({
  reducerPath: "partnerRegistrationApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["MyRegistration", "PartnerApprovals"],
  endpoints: (builder) => ({
    // Public sign-up (no auth needed)
    registerPartner: builder.mutation<
      { partner_id: string; email: string; status: PartnerStatus; message: string },
      {
        email: string;
        password: string;
        fullname: string;
        phone?: string;
        business_name?: string;
        address?: string;
        city?: string;
        province?: string;
        postal_code?: string;
      }
    >({
      query: (body) => ({ url: `/auth/partner-register`, method: "POST", body }),
      transformResponse: (res: ApiOk<{ partner_id: string; email: string; status: PartnerStatus; message: string }>) => res.data,
    }),

    // Partner self
    getMyRegistration: builder.query<PartnerRegistration, void>({
      query: () => `/partners/me/registration`,
      transformResponse: (res: ApiOk<PartnerRegistration>) => res.data,
      providesTags: ["MyRegistration"],
    }),
    updateMyRegistration: builder.mutation<
      void,
      Partial<{
        fullname: string;
        phone: string;
        business_name: string;
        address: string;
        city: string;
        province: string;
        postal_code: string;
        valid_id_data_url: string;
        valid_id_type: string;
        contract_data_url: string;
        gcash_number: string;
        gcash_holder_name: string;
        maya_number: string;
        maya_holder_name: string;
        bank_name: string;
        bank_account_name: string;
        bank_account_number: string;
        tax_id: string;
        tax_registered_name: string;
      }>
    >({
      query: (body) => ({ url: `/partners/me/registration`, method: "PATCH", body }),
      invalidatesTags: ["MyRegistration"],
    }),

    // Admin approval queue
    getPartnerApprovals: builder.query<
      AdminListResponse,
      { status?: PartnerStatus | "all" } | void
    >({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params?.status) qs.set("status", params.status);
        const s = qs.toString();
        return `/admin/partner-approvals${s ? `?${s}` : ""}`;
      },
      transformResponse: (res: ApiOk<AdminPartnerRow[]>) => ({
        rows: res.data,
        counts: res.counts || {},
      }),
      providesTags: ["PartnerApprovals"],
    }),

    reviewPartner: builder.mutation<
      AdminPartnerRow,
      { id: string; action: "approve" | "reject" | "suspend" | "reactivate"; reason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/partner-approvals/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: ApiOk<AdminPartnerRow>) => res.data,
      invalidatesTags: ["PartnerApprovals"],
    }),
  }),
});

export const {
  useRegisterPartnerMutation,
  useGetMyRegistrationQuery,
  useUpdateMyRegistrationMutation,
  useGetPartnerApprovalsQuery,
  useReviewPartnerMutation,
} = partnerRegistrationApi;
