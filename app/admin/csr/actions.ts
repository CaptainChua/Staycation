'use server';

import pool from '@/backend/config/db';

export interface DepositRecord {
  deposit_id: string; // Using booking id as deposit id for now
  booking_id: string;
  guest: string;
  haven: string;
  tower: string;
  deposit_amount: number; // Numeric for sorting
  formatted_amount: string; // For display
  status: string;
  checkout_date: string;
  checkout_date_raw: Date;
}

export async function getDeposits(): Promise<DepositRecord[]> {
  const client = await pool.connect();
  try {
    // Join bookings with havens on room_name = haven_name to get tower
    // We filter for bookings that have a security deposit and ensure uniqueness
    const query = `
      WITH unique_bookings AS (
        SELECT DISTINCT ON (b.booking_id) b.*
        FROM bookings b
        WHERE b.security_deposit > 0
        ORDER BY b.booking_id, b.created_at DESC
      ),
      unique_havens AS (
        SELECT DISTINCT ON (haven_name) haven_name, tower
        FROM havens
        ORDER BY haven_name
      )
      SELECT 
        ub.id,
        ub.booking_id,
        ub.guest_first_name,
        ub.guest_last_name,
        ub.room_name,
        ub.security_deposit,
        ub.status as booking_status,
        ub.check_out_date,
        ub.check_out_time,
        uh.tower
      FROM unique_bookings ub
      LEFT JOIN unique_havens uh ON ub.room_name = uh.haven_name
      ORDER BY ub.check_out_date DESC
    `;
    
    const result = await client.query(query);

    return result.rows.map(row => {
      // Map booking status to deposit status logic
      let depositStatus = 'Pending';
      if (['confirmed', 'checked-in'].includes(row.booking_status)) {
        depositStatus = 'Processing';
      } else if (row.booking_status === 'completed') {
        depositStatus = 'Returned';
      } else if (['cancelled', 'rejected'].includes(row.booking_status)) {
        depositStatus = 'Forfeited';
      }

      // Format Amount
      const amount = parseFloat(row.security_deposit);
      const formattedAmount = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0
      }).format(amount);

      // Format Date
      const checkoutDate = new Date(row.check_out_date);
      // Combine date and time if needed, for now just date
      const formattedDate = checkoutDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) + (row.check_out_time ? ` ${row.check_out_time}` : '');

      // Format Tower
      let towerDisplay = row.tower || 'Unknown';
      if (towerDisplay !== 'Unknown') {
        towerDisplay = towerDisplay
          .split('-')
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }

      // Format Haven Name
      const havenDisplay = row.room_name ? row.room_name.replace(/Room/i, 'Haven') : 'Unknown Haven';

      return {
        deposit_id: row.booking_id, // Reuse booking_id or generate a "DP-" + id prefix? User UI has "DP-001". Using booking_id for unique ref.
        booking_id: row.booking_id,
        guest: `${row.guest_first_name} ${row.guest_last_name}`,
        haven: havenDisplay,
        tower: towerDisplay,
        deposit_amount: amount,
        formatted_amount: formattedAmount,
        status: depositStatus,
        checkout_date: formattedDate,
        checkout_date_raw: checkoutDate
      };
    });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    throw new Error('Failed to fetch deposits');
  } finally {
    client.release();
  }
}

// Action to update status (simulated by updating booking status for now, or just placeholder if user wants real-time update on "deposit" status which doesn't exist)
// Since we don't have a deposit_status column, updating status might mean updating booking status?
// Or maybe just for the UI state?
// The prompt says "Ensure the 'View', 'Refund', and 'Delete' icons in the Actions column are hooked up to functions that update the Neon DB status in real-time."
// If I assume "Refund" -> sets booking to "completed" (Returned)? 
// "Delete" -> maybe remove record?
// I'll add a placeholder action for now.

export async function updateDepositStatus(deposit_id: string, newStatus: string): Promise<void> {
  "use server";
  const client = await pool.connect();
  try {
    // Map UI deposit status to an existing booking status value (bookings.status appears to be lower-case).
    const mappedStatus: string =
      (
        {
          Pending: "pending",
          Processing: "confirmed",
          Returned: "completed",
          Forfeited: "cancelled",
        } as Record<string, string>
      )[newStatus] ?? newStatus;

    // Parameterized query for Neon/Postgres
    await client.query(
      `
      UPDATE bookings
      SET status = $2
      WHERE booking_id = $1
      `,
      [deposit_id, mappedStatus]
    );
  } catch (error) {
    console.error("Error updating deposit status:", error);
    throw new Error("Failed to update deposit status");
  } finally {
    client.release();
  }
}
