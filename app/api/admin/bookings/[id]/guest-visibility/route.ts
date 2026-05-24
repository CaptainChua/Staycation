import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/backend/config/db";

// PATCH /api/admin/bookings/:id/guest-visibility
//
// Body: { override: boolean | null }
//   true  → force guest details visible to the partner for this booking
//   false → force guest details hidden
//   null  → clear the override (fall back to partner-level default)
//
// Owner-only. Partners cannot change this.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role !== "Owner") {
      return NextResponse.json(
        { success: false, error: "Only Owner can change guest-detail visibility" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Booking id is required" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({} as { override?: unknown }));
    const raw = (body as { override?: unknown }).override;
    let override: boolean | null;
    if (raw === null) override = null;
    else if (typeof raw === "boolean") override = raw;
    else {
      return NextResponse.json(
        { success: false, error: "`override` must be true, false, or null" },
        { status: 400 }
      );
    }

    const result = await pool.query<{ id: string; show_guest_details_override: boolean | null }>(
      `UPDATE booking
         SET show_guest_details_override = $1
       WHERE id = $2
       RETURNING id, show_guest_details_override`,
      [override, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update visibility";
    console.error("[admin/bookings/:id/guest-visibility] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
