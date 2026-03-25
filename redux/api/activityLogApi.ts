import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ADMIN_API_ENDPOINTS } from "@/lib/apiEndpoints";

export const activityLogApi = createApi({
    reducerPath: "activityLogApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/api/admin" }),
    tagTypes: ['ActivityLog', 'ActivityStats'],
    endpoints: (builder) => ({
        getActivityLogs: builder.query({
            query(params) {
                return {
                    url: ADMIN_API_ENDPOINTS.ACTIVITY_LOGS.replace("https://staycationhavenph.com", ""),
                    params
                };
            },
            providesTags: ['ActivityLog']
        }),

        getActivityStats: builder.query({
            query() {
                return {
                    url: "/activity-stats"
                };
            },
            providesTags: ['ActivityStats']
        }),

        createActivityLog: builder.mutation({
            query(body) {
                return {
                    url: ADMIN_API_ENDPOINTS.ACTIVITY_LOGS.replace("https://staycationhavenph.com", ""),
                    method: "POST",
                    body
                }
            },
            invalidatesTags: ['ActivityLog', 'ActivityStats']
        }),

        deleteActivityLog: builder.mutation({
            query(id) {
                return {
                    url: ADMIN_API_ENDPOINTS.ACTIVITY_LOGS.replace("https://staycationhavenph.com", ""),
                    method: "DELETE",
                    params: { id }
                }
            },
            invalidatesTags: ['ActivityLog']
        }),
    })
});

export const {
    useGetActivityLogsQuery,
    useGetActivityStatsQuery,
    useCreateActivityLogMutation,
    useDeleteActivityLogMutation
} = activityLogApi;
