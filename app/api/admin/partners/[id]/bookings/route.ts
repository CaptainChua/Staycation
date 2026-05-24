import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/backend/config/db";

// GET /api/admin/partners/:id/bookings
//
// Owner-only listing of a partner's recent bookings so the Partner Management
// UI can render per-booking guest-visibility toggles next to each one.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role !== "Owner") {
      return NextResponse.json(
        { success: false, error: "Owner only" },
        { status: 403 }
      );
    }

    const { id: partnerId } = await params;
    if (!partnerId) {
      return NextResponse.json(
        { success: false, error: "Partner id required" },
        { status: 400 }
      );
    }

    // Try the modern query first (with override column). If the migration
    // hasn't been run yet, retry without that column so bookings still load.
    const buildQuery = (includeOverride: boolean) => `
      SELECT
        b.id           AS booking_uuid,
        b.booking_id,
        b.room_name,
        b.check_in_date,
        b.check_out_date,
        b.status,
        ${includeOverride ? "b.show_guest_details_override," : "NULL::boolean AS show_guest_details_override,"}
        bg.first_name  AS guest_first_name,
        bg.last_name   AS guest_last_name
      FROM booking b
      JOIN havens h          ON h.haven_name = b.room_name
      LEFT JOIN LATERAL (
        SELECT first_name, last_name
        FROM booking_guests
        WHERE booking_id = b.id
        ORDER BY id
        LIMIT 1
      ) bg ON true
      WHERE h.partner_id = $1
      ORDER BY b.created_at DESC
      LIMIT 100;
    `;

    let result;
    let migrationApplied = true;
    try {
      result = await pool.query(buildQuery(true), [partnerId]);
    } catch (innerErr) {
      console.warn(
        "[admin/partners/:id/bookings] show_guest_details_override missing, falling back:",
        innerErr instanceof Error ? innerErr.message : innerErr
      );
      migrationApplied = false;
      result = await pool.query(buildQuery(false), [partnerId]);
    }

    return NextResponse.json({
      success: true,
      data: result.rows,
      meta: { migration_applied: migrationApplied },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load partner bookings";
    console.error("[admin/partners/:id/bookings] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
