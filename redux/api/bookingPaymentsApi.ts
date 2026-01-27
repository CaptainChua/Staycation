import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BookingPayment,
  BookingPaymentsListResponse,
  BookingPaymentItemResponse,
  CreateBookingPaymentPayload,
  UpdateBookingPaymentPayload,
} from "@/types/bookingPayment";

/**
 * bookingPaymentsApi
 *
 * Direct API for `booking_payments` table. No fallbacks to bookings,
 * fully typed transforms using the shared BookingPayment types.
 */
export const bookingPaymentsApi = createApi({
  reducerPath: "bookingPaymentsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["BookingPayment"],
  endpoints: (builder) => ({
    // GET /api/booking-payments?status=...
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
      transformResponse: (response: BookingPaymentsListResponse) => {
        // Server contract: { success: boolean, data: BookingPayment[] }
        return response.data ?? [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "BookingPayment" as const,
                id,
              })),
              { type: "BookingPayment" as const, id: "LIST" },
            ]
          : [{ type: "BookingPayment" as const, id: "LIST" }],
    }),

    // GET /api/booking-payments/:id
    getBookingPaymentById: builder.query<BookingPayment, string>({
      query(id: string) {
        return { url: `/booking-payments/${id}` };
      },
      transformResponse: (response: BookingPaymentItemResponse) => {
        return response.data;
      },
      providesTags: (_result, _error, id) => [
        { type: "BookingPayment" as const, id },
      ],
    }),

    // POST /api/booking-payments
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
      invalidatesTags: [{ type: "BookingPayment", id: "LIST" }],
    }),

    // PUT /api/booking-payments/:id
    updateBookingPayment: builder.mutation<
      BookingPayment,
      UpdateBookingPaymentPayload & { id: string }
    >({
      query(payload) {
        const { id, ...rest } = payload;
        return {
          url: `/booking-payments/${id}`,
          method: "PUT",
          body: rest,
        };
      },
      // Invalidate the specific payment and the list
      invalidatesTags: (_result, _error, { id }) => [
        { type: "BookingPayment" as const, id },
        { type: "BookingPayment" as const, id: "LIST" },
      ],
    }),

    // DELETE /api/booking-payments/:id
    deleteBookingPayment: builder.mutation<{ success: boolean }, string>({
      query(id: string) {
        return {
          url: `/booking-payments/${id}`,
          method: "DELETE",
        };
      },
      invalidatesTags: (_result, _error, id) => [
        { type: "BookingPayment" as const, id },
        { type: "BookingPayment" as const, id: "LIST" },
      ],
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
