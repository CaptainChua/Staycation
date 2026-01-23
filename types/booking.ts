/**
 * Shared booking types
 *
 * - BookingListItem: minimal / list-friendly shape returned by list endpoints (GET /api/bookings)
 * - BookingFull: full booking payload returned by detail endpoint (GET /api/bookings/:id)
 *
 * Keep these types narrow and explicit so callers can pick the right shape
 * (list vs full) and avoid breaking changes when adding/removing fields.
 */

export interface AdditionalGuest {
  firstName?: string;
  lastName?: string;
  age?: number | string;
  gender?: string;
  validIdUrl?: string;
}

export interface BookingListItem {
  // Core identifiers
  id: string;
  booking_id: string;

  // Guest (primary)
  guest_first_name: string;
  guest_last_name: string;
  guest_email?: string;
  guest_phone?: string;
  guest_gender?: string | null;
  facebook_link?: string | null;

  // Basic stay / UI fields (list views usually show these)
  room_name?: string | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  // Optional time fields present on some list responses
  check_in_time?: string | null;
  check_out_time?: string | null;

  // Basic counts & amounts
  adults?: number;
  children?: number;
  infants?: number;

  // Payment summary (lists often show a summary)
  payment_method?: string | null;
  payment_proof_url?: string | null;
  down_payment?: number | null;
  total_amount?: number | null;
  remaining_balance?: number | null;

  // Administrative
  status?: string | null;
  cleaning_status?: "pending" | "in-progress" | "cleaned" | "inspected" | null;
  rejection_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Booking extends BookingListItem {
  // Make sure detailed fields that detail views expect are present
  // (these mirror the database and booking detail query)
  room_rate: number;
  security_deposit: number;
  add_ons_total: number;
  add_ons?: unknown;
  additional_guests?: AdditionalGuest[] | null;

  // Full date/time fields
  check_in_time: string;
  check_out_time: string;

  // Required counts for detail view (safe to be strict here)
  adults: number;
  children: number;
  infants: number;

  // Optional extras and links
  valid_id_url?: string | null;
  room_images?: string[]; // populated by JOINs in the detail query
  tower?: string | null;

  // user reference if present
  user_id?: string | null;
}
