import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type BlockType =
  | "manual_partner"
  | "manual_admin"
  | "maintenance"
  | "imported_external";

export interface CalendarBlock {
  id: string;
  from_date: string;
  to_date: string;
  reason: string | null;
  block_type: BlockType;
  external_source?: string | null;
  external_uid?: string | null;
  external_summary?: string | null;
  synced_at?: string | null;
  created_at: string;
}

export interface CalendarBooking {
  id: string;
  booking_id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  booking_source: string;
}

export interface CalendarData {
  blocks: CalendarBlock[];
  bookings: CalendarBooking[];
}

export type ICalSource = "airbnb" | "booking.com" | "agoda" | "vrbo" | "other";

export interface ICalFeed {
  id: string;
  haven_id?: string;
  source: ICalSource;
  label: string | null;
  url: string;
  is_active: boolean;
  last_synced_at: string | null;
  last_status: "ok" | "error" | null;
  last_error: string | null;
  last_event_count: number;
  created_at: string;
}

export interface SyncResult {
  feed_id: string;
  source: string;
  ok: boolean;
  events_imported: number;
  events_removed: number;
  error?: string;
}

interface ApiOk<T> {
  success: true;
  data: T;
}

export const partnerCalendarApi = createApi({
  reducerPath: "partnerCalendarApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Calendar", "ICalFeeds"],
  endpoints: (builder) => ({
    // Calendar: list + block + unblock
    getHavenCalendar: builder.query<
      CalendarData,
      { havenId: string; from?: string; to?: string }
    >({
      query: ({ havenId, from, to }) => {
        const qs = new URLSearchParams();
        if (from) qs.set("from", from);
        if (to) qs.set("to", to);
        const s = qs.toString();
        return `/partners/me/listings/${havenId}/calendar${s ? `?${s}` : ""}`;
      },
      transformResponse: (res: ApiOk<CalendarData>) => res.data,
      providesTags: (_r, _e, arg) => [{ type: "Calendar", id: arg.havenId }],
    }),
    blockHavenDates: builder.mutation<
      CalendarBlock,
      { havenId: string; from_date: string; to_date: string; reason?: string; block_type?: "manual_partner" | "maintenance" }
    >({
      query: ({ havenId, ...body }) => ({
        url: `/partners/me/listings/${havenId}/calendar`,
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiOk<CalendarBlock>) => res.data,
      invalidatesTags: (_r, _e, arg) => [{ type: "Calendar", id: arg.havenId }],
    }),
    unblockHavenDate: builder.mutation<void, { havenId: string; blockId: string }>({
      query: ({ havenId, blockId }) => ({
        url: `/partners/me/listings/${havenId}/calendar/${blockId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Calendar", id: arg.havenId }],
    }),

    // iCal feeds: list + add + remove + sync
    getICalFeeds: builder.query<ICalFeed[], { havenId: string }>({
      query: ({ havenId }) => `/partners/me/listings/${havenId}/ical-feeds`,
      transformResponse: (res: ApiOk<ICalFeed[]>) => res.data,
      providesTags: (_r, _e, arg) => [{ type: "ICalFeeds", id: arg.havenId }],
    }),
    addICalFeed: builder.mutation<
      ICalFeed,
      { havenId: string; source: ICalSource; url: string; label?: string }
    >({
      query: ({ havenId, ...body }) => ({
        url: `/partners/me/listings/${havenId}/ical-feeds`,
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiOk<ICalFeed>) => res.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: "ICalFeeds", id: arg.havenId },
        { type: "Calendar", id: arg.havenId },
      ],
    }),
    removeICalFeed: builder.mutation<void, { havenId: string; feedId: string }>({
      query: ({ havenId, feedId }) => ({
        url: `/partners/me/listings/${havenId}/ical-feeds/${feedId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "ICalFeeds", id: arg.havenId },
        { type: "Calendar", id: arg.havenId },
      ],
    }),
    syncICalFeed: builder.mutation<SyncResult, { havenId: string; feedId: string }>({
      query: ({ havenId, feedId }) => ({
        url: `/partners/me/listings/${havenId}/ical-feeds/${feedId}/sync`,
        method: "POST",
      }),
      transformResponse: (res: ApiOk<SyncResult>) => res.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: "ICalFeeds", id: arg.havenId },
        { type: "Calendar", id: arg.havenId },
      ],
    }),
  }),
});

export const {
  useGetHavenCalendarQuery,
  useBlockHavenDatesMutation,
  useUnblockHavenDateMutation,
  useGetICalFeedsQuery,
  useAddICalFeedMutation,
  useRemoveICalFeedMutation,
  useSyncICalFeedMutation,
} = partnerCalendarApi;
