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

      // Optimistic cache updates: apply quick patches to the list (for common
      // status filters) and the single-item cache. If the mutation fails we
      // undo the patches in the catch block.
      async onQueryStarted(
        args: UpdateBookingPaymentPayload & { id: string },
        { dispatch, queryFulfilled },
      ) {
        const { id, payment_status, rejection_reason, collect_amount } = args;

        // Helper that performs the same optimistic mutation on a `getBookingPayments`
        // list that was fetched with `arg` (either undefined or { status }).
        const patchList = (
          arg: { status?: string } | void,
        ): ReturnType<typeof dispatch> =>
          dispatch(
            bookingPaymentsApi.util.updateQueryData(
              "getBookingPayments",
              arg,
              (draft: BookingPayment[]) => {
                const idx = draft.findIndex((d) => d.id === id);
                if (idx === -1) return;

                const item = draft[idx];

                // If the list is filtered by status and the new status doesn't
                // match, remove it from the filtered list to reflect server
                // filtering behaviour optimistically.
                const statusFilter = arg && (arg as { status?: string }).status;
                if (typeof payment_status !== "undefined" && statusFilter) {
                  if (payment_status !== statusFilter) {
                    draft.splice(idx, 1);
                    return;
                  }
                }

                if (typeof payment_status !== "undefined") {
                  item.payment_status =
                    payment_status as BookingPayment["payment_status"];
                }

                if (typeof rejection_reason !== "undefined") {
                  item.rejection_reason = rejection_reason ?? null;
                }

                if (
                  typeof collect_amount !== "undefined" &&
                  collect_amount !== null
                ) {
                  const total = Number(item.total_amount ?? 0);
                  const prevPaid = Number(
                    item.amount_paid ?? item.down_payment ?? 0,
                  );
                  const prevRemaining =
                    typeof item.remaining_balance !== "undefined" &&
                    item.remaining_balance !== null
                      ? Number(item.remaining_balance)
                      : Math.max(0, total - prevPaid);
                  const collect = Math.max(0, Number(collect_amount) || 0);
                  const applied = Math.min(collect, Math.max(prevRemaining, 0));
                  const newPaid = prevPaid + applied;
                  const newRemaining = Math.max(0, total - newPaid);
                  item.amount_paid = newPaid;
                  item.remaining_balance = newRemaining;
                  if (item.booking) {
                    item.booking.amount_paid = newPaid;
                    item.booking.remaining_balance = newRemaining;
                  }
                }
              },
            ),
          );

        // Apply patches to the full list and common filtered lists.
        const patches: Array<ReturnType<typeof dispatch>> = [];
        patches.push(patchList(undefined));
        patches.push(patchList({ status: "pending" }));
        patches.push(patchList({ status: "approved" }));
        patches.push(patchList({ status: "rejected" }));
        patches.push(patchList({ status: "refunded" }));

        // Also patch the single-item cache for this payment (if present)
        const patchById = dispatch(
          bookingPaymentsApi.util.updateQueryData(
            "getBookingPaymentById",
            id,
            (draft: BookingPayment | undefined) => {
              if (!draft) return;
              if (typeof payment_status !== "undefined") {
                draft.payment_status =
                  payment_status as BookingPayment["payment_status"];
              }
              if (typeof rejection_reason !== "undefined") {
                draft.rejection_reason = rejection_reason ?? null;
              }

              if (
                typeof collect_amount !== "undefined" &&
                collect_amount !== null
              ) {
                const total = Number(draft.total_amount ?? 0);
                const prevPaid = Number(
                  draft.amount_paid ?? draft.down_payment ?? 0,
                );
                const prevRemaining =
                  typeof draft.remaining_balance !== "undefined" &&
                  draft.remaining_balance !== null
                    ? Number(draft.remaining_balance)
                    : Math.max(0, total - prevPaid);
                const collect = Math.max(0, Number(collect_amount) || 0);
                const applied = Math.min(collect, Math.max(prevRemaining, 0));
                const newPaid = prevPaid + applied;
                const newRemaining = Math.max(0, total - newPaid);
                draft.amount_paid = newPaid;
                draft.remaining_balance = newRemaining;
                if (draft.booking) {
                  draft.booking.amount_paid = newPaid;
                  draft.booking.remaining_balance = newRemaining;
                }
              }
            },
          ),
        );
        patches.push(patchById);

        try {
          await queryFulfilled;
        } catch {
          // Undo optimistic patches on failure
          for (const p of patches) {
            try {
              (p as { undo?: () => void })?.undo?.();
            } catch {
              // best-effort
            }
          }
        }
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
