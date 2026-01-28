import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const bookingsApi = createApi({
  reducerPath: "bookingsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api"}),
  tagTypes: ['Booking'],
  endpoints: (builder) => ({
    getBookings: builder.query({
      query(params) {
        return {
          url: "/bookings",
          params
        };
      },
      transformResponse: (response: { success: boolean; data: unknown[] }) => {
        return response.data || [];
      },
      providesTags: ['Booking']
    }),

    // Get booking by ID
    getBookingById: builder.query({
      query(id) {
        return {
          url: `/bookings/${id}`
        };
      },
      providesTags: ['Booking']
    }),

    // Create booking
    createBooking: builder.mutation({
      query(body) {
        return {
          url: "/bookings",
          method: "POST",
          body
        }
      },
      invalidatesTags: ['Booking']
    }),

    // Update booking status - FIXED: Send ID in body, not URL
    updateBookingStatus: builder.mutation({
      query(body) {
        return {
          url: `/bookings`,  // ✅ FIXED: Removed /${id} from URL
          method: "PUT",
          body  // ✅ ID is now sent in the body where controller expects it
        }
      },
      invalidatesTags: ['Booking']
    }),

    // Delete booking
    deleteBooking: builder.mutation({
      query(id) {
        return {
          url: `/bookings`,
          method: "DELETE",
          params: { id }
        }
      },
      invalidatesTags: ['Booking']
    }),

    // Get user's bookings
    getUserBookings: builder.query({
      query({ userId, status }) {
        return {
          url: `/bookings/user/${userId}`,
          params: status ? { status } : {}
        };
      },
      providesTags: ['Booking']
    }),

    // Get bookings for a specific room/haven
    getRoomBookings: builder.query({
      query(havenId) {
        return {
          url: `/bookings/room/${havenId}`
        };
      },
      providesTags: ['Booking']
    }),
  })
});

export const {
  useGetBookingsQuery,
  useGetBookingByIdQuery,
  useCreateBookingMutation,
  useUpdateBookingStatusMutation,
  useDeleteBookingMutation,
  useGetUserBookingsQuery,
  useGetRoomBookingsQuery,
} = bookingsApi;