/**
 * Shared types for CSR payment components
 * - Keep payment-related shapes in a central place so modals and the page can
 *   import the same definitions without creating circular runtime imports.
 */

import type { BookingPayment } from "@/types/bookingPayment";

export type PaymentStatus =
  | "Down payment pending"
  | "Down payment approved"
  | "Full payment pending"
  | "Full payment approved"
  | "Rejected";

export interface PaymentRow {
  id?: string;
  booking_id: string;
  guest: string;
  guest_email?: string;
  guest_phone?: string;
  facebook_link?: string;
  valid_id_url?: string;

  // Check-in/Check-out dates and times
  check_in_date?: string;
  check_in_time?: string;
  check_out_date?: string;
  check_out_time?: string;

  // Room and add-ons details
  roomRate?: number;
  addOnsTotal?: number;
  security_deposit?: number;
  deposit_status?: string;

  // Formatted and numeric totals for display/sorting
  totalAmount: string;
  totalAmountValue?: number;

  // Original down payment submitted
  downPayment: string;
  downPaymentValue?: number;

  // Cumulative amount paid so far (amount_paid)
  amountPaid: string;
  amountPaidValue?: number;

  // Remaining balance (total - amount_paid), non-negative
  remaining: string;
  remainingValue?: number;

  payment_proof?: string | null;
  payment_method?: string;
  payment_status?: string;
  room_name?: string;
  status: PaymentStatus;
  statusColor: string;
  booking?: BookingPayment["booking"];
}
