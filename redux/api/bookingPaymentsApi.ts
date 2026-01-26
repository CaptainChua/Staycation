import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BookingPayment,
  CreateBookingPaymentPayload,
  UpdateBookingPaymentPayload,
} from "@/types/bookingPayment";

export const bookingPaymentsApi = createApi({
  reducerPath: "bookingPaymentsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["BookingPayment"],
  endpoints: (builder) => ({
    // List / query booking payments (optional status param)
    getBookingPayments: builder.query<
      BookingPayment[],
      { status?: string } | void
    >({
      query(params?: { status?: string }) {
        return {
          url: "/booking-payments",
          params,
        };
      },
      transformResponse: (response: {
        success: boolean;
        data: BookingPayment[];
      }) => {
        return response.data || [];
      },
      providesTags: ["BookingPayment"],
    }),

    // Get single booking payment by id
    getBookingPaymentById: builder.query<BookingPayment, string>({
      query(id: string) {
        return { url: `/booking-payments/${id}` };
      },
      transformResponse: (response: {
        success: boolean;
        data: BookingPayment;
      }) => response.data,
      providesTags: ["BookingPayment"],
    }),

    // Create a new booking payment
    createBookingPayment: builder.mutation<
      BookingPayment,
      CreateBookingPaymentPayload
    >({
      query(body: CreateBookingPaymentPayload) {
        return {
          url: "/booking-payments",
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["BookingPayment"],
    }),

    // Update a booking payment (approve/reject/other edits)
    updateBookingPayment: builder.mutation<
      BookingPayment,
      UpdateBookingPaymentPayload
    >({
      query(body: UpdateBookingPaymentPayload & { id: string }) {
        const { id, ...rest } = body;
        return {
          url: `/booking-payments/${id}`,
          method: "PUT",
          body: rest,
        };
      },
      invalidatesTags: ["BookingPayment"],
    }),

    // Delete a booking payment
    deleteBookingPayment: builder.mutation<{ success: boolean }, string>({
      query(id: string) {
        return {
          url: `/booking-payments/${id}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["BookingPayment"],
    }),
  }),
});

export const {
  useGetBookingPaymentsQuery,
  useGetBookingPaymentByIdQuery,
  useCreateBookingPaymentMutation,
  useUpdateBookingPaymentMutation,
  useDeleteBookingPaymentMutation,
} = bookingPaymentsApi;
