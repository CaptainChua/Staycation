import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface BlockedDate {
  id: string;
  haven_id: string;
  from_date: string;
  to_date: string;
  reason?: string;
  created_at: string;
  haven_name?: string;
  tower?: string;
  floor?: string;
}

export interface BlockedDatesResponse {
  success: boolean;
  data: BlockedDate[];
  count: number;
}

export interface BlockedDateResponse {
  success: boolean;
  data: BlockedDate;
  message?: string;
}

export const blockedDatesApi = createApi({
  reducerPath: "blockedDatesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ['BlockedDate'],
  endpoints: (builder) => ({
    // Get all blocked dates
    getBlockedDates: builder.query<BlockedDatesResponse, { haven_id?: string }>({
      query: (params) => ({
        url: "/admin/blocked-dates",
        params,
      }),
      providesTags: ['BlockedDate'],
    }),

    // Get blocked date by ID
    getBlockedDateById: builder.query<BlockedDateResponse, string>({
      query: (id) => ({
        url: `/admin/blocked-dates/${id}`,
      }),
      providesTags: ['BlockedDate'],
    }),

    // Create blocked date
    createBlockedDate: builder.mutation<BlockedDateResponse, Partial<BlockedDate>>({
      query: (body) => ({
        url: "/admin/blocked-dates",
        method: "POST",
        body,
      }),
      invalidatesTags: ['BlockedDate'],
    }),

    // Update blocked date
    updateBlockedDate: builder.mutation<BlockedDateResponse, Partial<BlockedDate>>({
      query: (body) => ({
        url: "/admin/blocked-dates",
        method: "PUT",
        body,
      }),
      invalidatesTags: ['BlockedDate'],
    }),

    // Delete blocked date
    deleteBlockedDate: builder.mutation<BlockedDateResponse, string>({
      query: (id) => ({
        url: "/admin/blocked-dates",
        method: "DELETE",
        params: { id },
      }),
      invalidatesTags: ['BlockedDate'],
    }),
  }),
});

export const {
  useGetBlockedDatesQuery,
  useGetBlockedDateByIdQuery,
  useCreateBlockedDateMutation,
  useUpdateBlockedDateMutation,
  useDeleteBlockedDateMutation,
} = blockedDatesApi;
