import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { requireEmployee } from "@/backend/utils/requireAdmin";

function formatTimeHHMM(time: string): string | null {
  if (!time || time === "00:00:00" || time === "00:00") return null;
  const [h, m] = time.substring(0, 5).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export async function GET(req: NextRequest) {
  const guard = await requireEmployee();
  if (!guard.ok) return guard.response;
  const { searchParams } = new URL(req.url);
  const includeId = searchParams.get("include_id");

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
        INNER JOIN booking b ON REPLACE(LOWER(b.room_name), 'room', 'haven') = REPLACE(LOWER(h.haven_name), 'room', 'haven')
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
            const t = formatTimeHHMM(row.check_out_time);
            if (t) checkOutDisplay += ` · ${t}`;
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

      // When include_id is provided, always fetch that haven's closest booking and
      // replace any existing entry (which may carry an old completed booking's dates).
      if (includeId) {
        const existingIdx = havens.findIndex((h) => h.id === includeId);
        if (existingIdx !== -1) havens.splice(existingIdx, 1);
        try {
          const upcomingRes = await client.query(`
            SELECT DISTINCT ON (h.uuid_id)
              h.uuid_id, h.haven_name, h.tower, h.floor, h.updated_at,
              b.id as booking_id, b.booking_id as booking_ref,
              b.status as booking_status,
              b.check_out_date, b.check_out_time,
              bg.first_name as guest_first_name, bg.last_name as guest_last_name,
              bc.cleaning_status
            FROM havens h
            INNER JOIN booking b ON REPLACE(LOWER(b.room_name), 'room', 'haven') = REPLACE(LOWER(h.haven_name), 'room', 'haven')
            INNER JOIN booking_cleaning bc ON bc.booking_id = b.id
            LEFT JOIN booking_guests bg ON bg.booking_id = b.id
              AND bg.id = (SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1)
            WHERE (h.uuid_id = $1::uuid OR b.id = $1::uuid)
              AND b.status NOT IN ('rejected', 'cancelled')
            ORDER BY h.uuid_id,
              ABS(b.check_out_date::date - CURRENT_DATE) ASC
          `, [includeId]);

          if (upcomingRes.rows.length > 0) {
            const row = upcomingRes.rows[0];
            const name = row.haven_name.replace(/Room/i, "Haven");
            const towerName = row.tower
              .split("-")
              .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" ");
            const guestName = [row.guest_first_name, row.guest_last_name].filter(Boolean).join(" ") || "Guest";
            let checkOutDisplay = "";

            // Build the checkout display string and compare against now.
            let checkOutDateTime: Date | null = null;
            if (row.check_out_date) {
              const datePart = new Date(row.check_out_date).toISOString().split("T")[0];
              const timePart = row.check_out_time || "00:00:00";
              checkOutDateTime = new Date(`${datePart}T${timePart}`);
              checkOutDisplay = new Date(row.check_out_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const t2 = formatTimeHHMM(row.check_out_time);
              if (t2) checkOutDisplay += ` · ${t2}`;
            }

            // Guest is considered "still in room" only when the booking is NOT yet
            // completed AND the scheduled checkout datetime is still in the future.
            // If the guest checks out early (status → 'completed'), this flag turns
            // false on the next page load and cleaning is unlocked immediately.
            const alreadyCheckedOut = row.booking_status === "completed";
            const isUpcoming = !alreadyCheckedOut && (checkOutDateTime ? checkOutDateTime > new Date() : true);

            havens.unshift({
              id: row.uuid_id,
              name,
              address: `${towerName}, Floor ${row.floor}`,
              status: isUpcoming ? "Upcoming" : "Checked Out",
              lastCleaned: new Date(row.updated_at).toLocaleDateString(),
              bookingId: row.booking_ref,
              bookingUuid: row.booking_id,
              guestName,
              checkOutDate: checkOutDisplay,
              cleaningStatus: row.cleaning_status,
              isUpcoming,
            } as any);
          }
        } catch {
          // non-fatal — just don't include the upcoming haven
        }
      }

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
