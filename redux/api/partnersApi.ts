import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Partner {
  id: string;
  email: string;
  fullname: string;
  phone?: string;
  address?: string;
  type: string;
  commission_rate: number;
  commission_total: number;
  payment_method?: string;
  bank_name?: string;
  account_number?: string;
  status: 'active' | 'pending' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface PartnersResponse {
  success: boolean;
  data: Partner[];
  count: number;
}

export interface PartnerResponse {
  success: boolean;
  data: Partner;
  message?: string;
}

export interface CreatePartnerData {
  email: string;
  password: string;
  fullname: string;
  phone?: string;
  address?: string;
  type?: string;
  commission_rate?: number;
  payment_method?: string;
  bank_name?: string;
  account_number?: string;
}

export interface UpdatePartnerData extends Partial<CreatePartnerData> {
  id: string;
}

export const partnersApi = createApi({
  reducerPath: "partnersApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ['Partner'],
  endpoints: (builder) => ({
    // Get all partners
    getPartners: builder.query<PartnersResponse, { status?: string; search?: string } | void>({
      query: (params) => ({
        url: "/admin/partners",
        params: params || {},
      }),
      providesTags: ['Partner'],
    }),

    // Get partner by ID
    getPartnerById: builder.query<PartnerResponse, string>({
      query: (id) => ({
        url: `/admin/partners/${id}`,
      }),
      providesTags: ['Partner'],
    }),

    // Create partner
    createPartner: builder.mutation<PartnerResponse, CreatePartnerData>({
      query: (body) => ({
        url: "/admin/partners",
        method: "POST",
        body,
      }),
      invalidatesTags: ['Partner'],
    }),

    // Update partner
    updatePartner: builder.mutation<PartnerResponse, UpdatePartnerData>({
      query: (body) => ({
        url: `/admin/partners/${body.id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ['Partner'],
    }),

    // Delete partner
    deletePartner: builder.mutation<PartnerResponse, string>({
      query: (id) => ({
        url: "/admin/partners",
        method: "DELETE",
        params: { id },
      }),
      invalidatesTags: ['Partner'],
    }),

    // Update partner status
    updatePartnerStatus: builder.mutation<PartnerResponse, { id: string; status: string }>({
      query: (body) => ({
        url: "/admin/partners/status",
        method: "PUT",
        body,
      }),
      invalidatesTags: ['Partner'],
    }),
  }),
});

export const {
  useGetPartnersQuery,
  useGetPartnerByIdQuery,
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
  useDeletePartnerMutation,
  useUpdatePartnerStatusMutation,
} = partnersApi;
