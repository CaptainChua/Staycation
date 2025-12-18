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

    // Update booking status
    updateBookingStatus: builder.mutation({
      query(body) {
        const { id } = body;
        return {
          url: `/bookings/${id}`,
          method: "PUT",
          body
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
  })
});

export const {
  useGetBookingsQuery,
  useGetBookingByIdQuery,
  useCreateBookingMutation,
  useUpdateBookingStatusMutation,
  useDeleteBookingMutation,
} = bookingsApi;
