import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type ListingStatus = "active" | "disabled" | "suspended";

interface ApiOk<T> { success: true; data: T }

export const havenListingStatusApi = createApi({
  reducerPath: "havenListingStatusApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/admin" }),
  tagTypes: [],
  endpoints: (builder) => ({
    setHavenListingStatus: builder.mutation<
      { uuid_id: string; haven_name: string; listing_status: ListingStatus; listing_status_reason: string | null },
      { havenId: string; listing_status: ListingStatus; reason?: string }
    >({
      query: ({ havenId, ...body }) => ({
        url: `/haven-listing-status/${havenId}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: ApiOk<{ uuid_id: string; haven_name: string; listing_status: ListingStatus; listing_status_reason: string | null }>) => res.data,
    }),
  }),
});

export const { useSetHavenListingStatusMutation } = havenListingStatusApi;
