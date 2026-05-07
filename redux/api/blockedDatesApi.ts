import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface BlockedDate {
  id: string;
  haven_id: string;
  from_date: string;
  to_date: string;
  reason?: string;
  status?: string;
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

const BLOCKED_DATES_ENDPOINT = "/admin/blocked-dates";

export const blockedDatesApi = createApi({
  reducerPath: "blockedDatesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ['BlockedDate'],
  endpoints: (builder) => ({
    // Get all blocked dates
    getBlockedDates: builder.query<BlockedDatesResponse, { haven_id?: string; status?: string }>({
      query: (params) => ({
        url: BLOCKED_DATES_ENDPOINT,
        params,
      }),
      transformResponse: (response: BlockedDatesResponse) => {
        return {
          success: response?.success ?? true,
          data: Array.isArray(response?.data) ? response.data : [],
          count: typeof response?.count === "number" ? response.count : 0,
        };
      },
      providesTags: ['BlockedDate'],
    }),

    // Get blocked date by ID
    getBlockedDateById: builder.query<BlockedDateResponse, string>({
      query: (id) => ({
        url: `${BLOCKED_DATES_ENDPOINT}/${id}`,
      }),
      providesTags: ['BlockedDate'],
    }),

    // Create blocked date
    createBlockedDate: builder.mutation<BlockedDateResponse, Partial<BlockedDate>>({
      query: (body) => ({
        url: BLOCKED_DATES_ENDPOINT,
        method: "POST",
        body,
      }),
      invalidatesTags: ['BlockedDate'],
    }),

    // Update blocked date
    updateBlockedDate: builder.mutation<BlockedDateResponse, Partial<BlockedDate>>({
      query: (body) => ({
        url: BLOCKED_DATES_ENDPOINT,
        method: "PUT",
        body,
      }),
      invalidatesTags: ['BlockedDate'],
    }),

    // Delete blocked date
    deleteBlockedDate: builder.mutation<BlockedDateResponse, string>({
      query: (id) => ({
        url: BLOCKED_DATES_ENDPOINT,
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
