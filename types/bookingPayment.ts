/**
 * Booking payment types
 *
 * These types model the `booking_payments` table and common payloads used by
 * the booking payments API. Field names use snake_case to match the DB / API
 * responses (consistent with the project's existing booking types).
 */

export type PaymentStatus = "pending" | "approved" | "rejected" | "refunded";

/**
 * A booking payment record returned by the API. Some endpoints may include
 * joined booking/guest fields (guest_first_name, guest_last_name, etc.)
 * — those are optional here because not all endpoints include joins.
 */
export interface BookingPayment {
  id: string;
  booking_fk?: string;
  booking_id: string;

  // Payment fields (from booking_payments table)
  payment_method: string;
  payment_proof_url?: string | null;
  room_rate: number;
  add_ons_total?: number | null;
  total_amount: number;
  down_payment: number;
  remaining_balance: number;
  // Total amount actually paid so far (useful to record incremental collections)
  amount_paid?: number;

  payment_status?: PaymentStatus | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  // Optional (joined) guest / booking fields that some endpoints return
  guest_first_name?: string | null;
  guest_last_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;

  // Optional nested booking object (some endpoints may return this)
  booking?: {
    id?: string;
    booking_id?: string;
    status?: string | null;
    guest_first_name?: string | null;
    guest_last_name?: string | null;
    guest_email?: string | null;
    guest_phone?: string | null;
    down_payment?: number | null;
    total_amount?: number | null;
    remaining_balance?: number | null;
    amount_paid?: number | null;
    payment_proof_url?: string | null;
    payment_method?: string | null;
    updated_at?: string | null;
    rejection_reason?: string | null;
  };
}

/** Payload to create a booking payment (server will populate defaults like id/created_at). */
export interface CreateBookingPaymentPayload {
  booking_id: string;
  payment_method: string;
  payment_proof_url?: string | null;
  room_rate: number;
  add_ons_total?: number;
  total_amount: number;
  down_payment: number;
  remaining_balance: number;
  // Optional initial amount already collected (defaults to 0 if omitted)
  amount_paid?: number;
}

/** Payload to update a booking payment. Keep fields optional to allow partial updates. */
export interface UpdateBookingPaymentPayload {
  id: string;

  // Typical CSR operations
  payment_status?: PaymentStatus;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;

  // Other editable fields (if API allows)
  payment_method?: string;
  payment_proof_url?: string | null;
  room_rate?: number;
  add_ons_total?: number;
  total_amount?: number;
  down_payment?: number;
  remaining_balance?: number;
  // Allows updating the cumulative amount paid (e.g. when collecting during check-in)
  amount_paid?: number;
  // Collect an amount to be applied atomically server-side (preferred for check-in collections)
  collect_amount?: number;
}

/** Standard list response from the API. */
export interface BookingPaymentsListResponse {
  success: boolean;
  data: BookingPayment[];
  count?: number;
  message?: string;
}

/** Single item response from the API. */
export interface BookingPaymentItemResponse {
  success: boolean;
  data: BookingPayment;
  message?: string;
}
