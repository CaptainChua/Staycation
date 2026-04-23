import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const activityLogApi = createApi({
    reducerPath: "activityLogApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/api/admin"}),
    tagTypes: ['ActivityLog', 'ActivityStats'],
    endpoints: (builder) => ({
        getActivityLogs: builder.query({
            query(params) {
                return {
                    url: "/activity-logs",
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
                    url: "/activity-logs",
                    method: "POST",
                    body
                }
            },
            invalidatesTags: ['ActivityLog', 'ActivityStats']
        }),

        deleteActivityLog: builder.mutation({
            query(id) {
                return {
                    url: "/activity-logs",
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
