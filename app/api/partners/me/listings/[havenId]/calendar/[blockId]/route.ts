import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

// DELETE /api/partners/me/listings/[havenId]/calendar/[blockId]
// Partners can only delete blocks they created (manual_partner / maintenance).
// External imports must be deleted by removing the source iCal feed; admin-imposed
// blocks must be cleared by an admin.
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ havenId: string; blockId: string }> }
) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { havenId, blockId } = await ctx.params;

    // Verify ownership AND that the block is partner-removable
    const check = await pool.query<{ block_type: string; haven_partner: string }>(
      `SELECT bd.block_type, h.partner_id::text AS haven_partner
       FROM blocked_dates bd
       JOIN havens h ON h.uuid_id = bd.haven_id
       WHERE bd.id = $1 AND bd.haven_id = $2`,
      [blockId, havenId]
    );
    if (check.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    if (check.rows[0].haven_partner !== partnerId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const removableTypes = ["manual_partner", "maintenance"];
    if (!removableTypes.includes(check.rows[0].block_type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This block can't be removed by you. External imports go away when you remove the feed; admin blocks must be cleared by an admin.",
        },
        { status: 403 }
      );
    }

    await pool.query(`DELETE FROM blocked_dates WHERE id = $1`, [blockId]);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to unblock";
    console.error("[partners/me/listings/[havenId]/calendar/[blockId] DELETE] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
