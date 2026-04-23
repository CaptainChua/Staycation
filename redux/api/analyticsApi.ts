import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface AnalyticsSummary {
  total_revenue: number;
  total_bookings: number;
  occupancy_rate: number;
  new_guests: number;
  revenue_change: number;
  bookings_change: number;
  occupancy_change: number;
  guests_change: number;
}

export interface RevenueByRoom {
  room_name: string;
  revenue: number;
  bookings: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export const analyticsApi = createApi({
    reducerPath: "analyticsApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/api/admin/analytics"}),
    tagTypes: ['AnalyticsSummary', 'RevenueByRoom', 'MonthlyRevenue'],
    endpoints: (builder) => ({
        getAnalyticsSummary: builder.query<{success: boolean; data: AnalyticsSummary}, {period?: string}>({
            query({period = '30'}) {
                return {
                    url: "/summary",
                    params: { period }
                };
            },
            providesTags: ['AnalyticsSummary']
        }),
        getRevenueByRoom: builder.query<{success: boolean; data: RevenueByRoom[]}, {period?: string}>({
            query({period = '30'}) {
                return {
                    url: "/revenue-by-room",
                    params: { period }
                };
            },
            providesTags: ['RevenueByRoom']
        }),
        getMonthlyRevenue: builder.query<{success: boolean; data: MonthlyRevenue[]}, {months?: string}>({
            query({months = '6'}) {
                return {
                    url: "/monthly-revenue",
                    params: { months }
                };
            },
            providesTags: ['MonthlyRevenue']
        }),
    })
});

export const {
    useGetAnalyticsSummaryQuery,
    useGetRevenueByRoomQuery,
    useGetMonthlyRevenueQuery,
} = analyticsApi;
