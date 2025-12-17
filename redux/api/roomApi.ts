import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const roomApi = createApi({
    reducerPath: "roomApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/api"}),
    tagTypes: ['Haven', 'Room'],
    endpoints: (builder) => ({
        // Get all havens/rooms
        getHavens: builder.query({
            query(params) {
                return {
                    url: "/haven",
                    params
                };
            },
            providesTags: ['Haven']
        }),

        // Get single haven by ID
        getHavenById: builder.query({
            query(id) {
                return {
                    url: `/haven/${id}`
                };
            },
            providesTags: ['Haven']
        }),

        // Create new haven
        createHaven: builder.mutation({
            query(body) {
                return {
                    url: "/haven/addHavenRoom",
                    method: "POST",
                    body
                }
            },
            invalidatesTags: ['Haven']
        }),

        // Update haven
        updateHaven: builder.mutation({
            query(body) {
                const { id } = body;
                return {
                    url: `/admin/haven/${id}`,
                    method: "PUT",
                    body
                }
            },
            invalidatesTags: ['Haven']
        }),

        // Delete haven
        deleteHaven: builder.mutation({
            query(id) {
                return {
                    url: `/admin/haven/${id}`,
                    method: "DELETE"
                }
            },
            invalidatesTags: ['Haven']
        }),
        getAllAdminRooms: builder.query({
             query(params) {
                return {
                    url: "/haven",
                    params
                };
            },
            providesTags: ['Haven']
        })
    })
});

export const {
    useGetHavensQuery,
    useGetHavenByIdQuery,
    useCreateHavenMutation,
    useUpdateHavenMutation,
    useDeleteHavenMutation,
    useGetAllAdminRoomsQuery
} = roomApi;