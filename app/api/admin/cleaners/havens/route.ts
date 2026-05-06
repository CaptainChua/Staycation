import { NextResponse } from "next/server";
import pool from "@/backend/config/db";

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      // Only return havens that have bookings with status 'completed' (checked out)
      // and where cleaning is still needed (cleaning_status is not 'cleaned' or 'inspected')
      const query = `
        SELECT DISTINCT ON (h.uuid_id)
          h.uuid_id,
          h.haven_name,
          h.tower,
          h.floor,
          h.updated_at,
          b.id as booking_id,
          b.booking_id as booking_ref,
          b.check_out_date,
          b.check_out_time,
          bg.first_name as guest_first_name,
          bg.last_name as guest_last_name,
          bc.cleaning_status
        FROM havens h
        INNER JOIN booking b ON b.room_name = h.haven_name
        INNER JOIN booking_cleaning bc ON bc.booking_id = b.id
        LEFT JOIN booking_guests bg ON bg.booking_id = b.id
          AND bg.id = (
            SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1
          )
        WHERE b.status = 'completed'
          AND bc.cleaning_status NOT IN ('cleaned', 'inspected')
        ORDER BY h.uuid_id, b.check_out_date DESC
      `;

      const result = await client.query(query);

      const havens = result.rows.map((row) => {
        // Format: "Haven 3"
        const name = row.haven_name.replace(/Room/i, "Haven");

        // Format: "Tower A"
        const towerName = row.tower
          .split("-")
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");

        const guestName =
          [row.guest_first_name, row.guest_last_name]
            .filter(Boolean)
            .join(" ") || "Guest";

        let checkOutDisplay = "";
        if (row.check_out_date) {
          try {
            checkOutDisplay = new Date(row.check_out_date).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            );
            if (row.check_out_time) {
              checkOutDisplay += ` ${row.check_out_time}`;
            }
          } catch {
            checkOutDisplay = "Unknown";
          }
        }

        return {
          id: row.uuid_id,
          name: name,
          address: `${towerName}, Floor ${row.floor}`,
          status: "Checked Out",
          lastCleaned: new Date(row.updated_at).toLocaleDateString(),
          bookingId: row.booking_ref,
          guestName,
          checkOutDate: checkOutDisplay,
          cleaningStatus: row.cleaning_status,
        };
      });

      return NextResponse.json(havens);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch havens" },
      { status: 500 },
    );
  }
}
