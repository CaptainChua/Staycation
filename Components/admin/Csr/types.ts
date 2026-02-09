/**
 * Shared types for CSR payment components
 * - Keep payment-related shapes in a central place so modals and the page can
 *   import the same definitions without creating circular runtime imports.
 */

import type { BookingPayment } from "@/types/bookingPayment";

export type PaymentStatus = "Paid" | "Pending" | "Rejected";

export interface PaymentRow {
  id?: string;
  booking_id: string;
  guest: string;

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
  status: PaymentStatus;
  statusColor: string;
  booking?: BookingPayment["booking"];
}
