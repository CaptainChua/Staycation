import { Booking } from "@/types/booking";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const bookingsApi = createApi({
  reducerPath: "bookingsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Booking"],
  endpoints: (builder) => ({
    getBookings: builder.query<Booking[], { status?: string } | void>({
      query(params?: { status?: string }) {
        return {
          url: "/bookings",
          params,
        };
      },
      transformResponse: (response: { success: boolean; data: Booking[] }) => {
        return response.data || [];
      },
      providesTags: ["Booking"],
    }),

    // Get booking by ID
    getBookingById: builder.query({
      query(id) {
        return {
          url: `/bookings/${id}`,
        };
      },
      providesTags: ["Booking"],
    }),

    // Create booking
    createBooking: builder.mutation({
      query(body) {
        return {
          url: "/bookings",
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["Booking"],
    }),

    // Update booking status
    updateBookingStatus: builder.mutation({
      query(body) {
        const { id } = body;
        return {
          url: `/bookings/${id}`,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: ["Booking"],
    }),

    // Delete booking
    deleteBooking: builder.mutation({
      query(id) {
        return {
          url: `/bookings`,
          method: "DELETE",
          params: { id },
        };
      },
      invalidatesTags: ["Booking"],
    }),

    // Get user's bookings
    getUserBookings: builder.query({
      query({ userId, status }) {
        return {
          url: `/bookings/user/${userId}`,
          params: status ? { status } : {},
        };
      },
      providesTags: ["Booking"],
    }),

    // Get bookings for a specific room/haven
    getRoomBookings: builder.query({
      query(havenId) {
        return {
          url: `/bookings/room/${havenId}`,
        };
      },
      providesTags: ["Booking"],
    }),

    // Update cleaning status
    updateCleaningStatus: builder.mutation({
      query({ id, cleaning_status }) {
        return {
          url: `/bookings/${id}/cleaning`,
          method: "PUT",
          body: { cleaning_status },
        };
      },
      invalidatesTags: ["Booking"],
    }),
  }),
});

export const {
  useGetBookingsQuery,
  useGetBookingByIdQuery,
  useCreateBookingMutation,
  useUpdateBookingStatusMutation,
  useDeleteBookingMutation,
  useGetUserBookingsQuery,
  useGetRoomBookingsQuery,
  useUpdateCleaningStatusMutation,
} = bookingsApi;
