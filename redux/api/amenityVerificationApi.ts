import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface AmenityVerificationMedia {
  url: string;
  type: "image" | "video" | "screenshot";
  public_id?: string;
  uploaded_at: string;
}

export type AmenityVerificationStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "revision_requested";

export interface AmenityVerification {
  id: string;
  haven_id: string;
  haven_name?: string;
  partner_id?: string;
  partner_fullname?: string | null;
  partner_email?: string | null;
  amenity_key: string;
  amenity_label: string;
  amenity_icon_key?: string | null;
  amenity_icon_url?: string | null;
  category: string;
  status: AmenityVerificationStatus;
  notes?: string | null;
  reviewer_notes?: string | null;
  rejection_reason?: string | null;
  media: AmenityVerificationMedia[];
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  reverify_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiOk<T> {
  success: true;
  data: T;
  counts?: Record<string, number>;
}

interface AdminListResponse {
  data: AmenityVerification[];
  counts: Record<string, number>;
}

export const amenityVerificationApi = createApi({
  reducerPath: "amenityVerificationApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["MyAmenityVerifications", "AdminAmenityVerifications"],
  endpoints: (builder) => ({
    // PARTNER: list verifications for one of their havens (or all if no haven_id)
    getMyAmenityVerifications: builder.query<AmenityVerification[], { havenId?: string } | void>({
      query: (params) =>
        `/partners/me/amenity-verifications${params?.havenId ? `?haven_id=${params.havenId}` : ""}`,
      transformResponse: (res: ApiOk<AmenityVerification[]>) => res.data,
      providesTags: ["MyAmenityVerifications"],
    }),

    // PARTNER: upload media / update notes for one verification
    updateMyAmenityVerification: builder.mutation<
      AmenityVerification,
      {
        id: string;
        new_media?: Array<{ data: string; type?: "image" | "video" | "screenshot" }>;
        remove_urls?: string[];
        notes?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/partners/me/amenity-verifications/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: ApiOk<AmenityVerification>) => res.data,
      invalidatesTags: ["MyAmenityVerifications", "AdminAmenityVerifications"],
    }),

    // ADMIN: queue list (filter by status / partner / haven)
    getAdminAmenityVerifications: builder.query<
      AdminListResponse,
      { status?: string; partner_id?: string; haven_id?: string } | void
    >({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params?.status) qs.set("status", params.status);
        if (params?.partner_id) qs.set("partner_id", params.partner_id);
        if (params?.haven_id) qs.set("haven_id", params.haven_id);
        const s = qs.toString();
        return `/admin/amenity-verifications${s ? `?${s}` : ""}`;
      },
      transformResponse: (res: ApiOk<AmenityVerification[]> & { counts: Record<string, number> }) => ({
        data: res.data,
        counts: res.counts || {},
      }),
      providesTags: ["AdminAmenityVerifications"],
    }),

    // ADMIN: verify / reject / request_revision
    reviewAmenityVerification: builder.mutation<
      AmenityVerification,
      {
        id: string;
        action: "verify" | "reject" | "request_revision";
        reviewer_notes?: string;
        rejection_reason?: string;
        reverify_at?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/amenity-verifications/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: ApiOk<AmenityVerification>) => res.data,
      invalidatesTags: ["AdminAmenityVerifications", "MyAmenityVerifications"],
    }),
  }),
});

export const {
  useGetMyAmenityVerificationsQuery,
  useUpdateMyAmenityVerificationMutation,
  useGetAdminAmenityVerificationsQuery,
  useReviewAmenityVerificationMutation,
} = amenityVerificationApi;
