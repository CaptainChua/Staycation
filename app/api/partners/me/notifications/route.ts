import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

export async function GET(req: NextRequest) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const where = unreadOnly ? "AND is_read = false" : "";
    const result = await pool.query(
      `SELECT
        id, kind, title, body, related_haven_id, related_booking_id,
        related_payout_id, is_read, action_url, created_at
       FROM partner_notifications
       WHERE partner_id = $1 ${where}
       ORDER BY created_at DESC
       LIMIT 100`,
      [partnerId]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "42P01") {
      return NextResponse.json({ success: true, data: [] });
    }
    const msg = err instanceof Error ? err.message : "Failed to load notifications";
    console.error("[partners/me/notifications] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, mark_all_read } = await req.json();

    if (mark_all_read) {
      await pool.query(
        `UPDATE partner_notifications SET is_read = true WHERE partner_id = $1 AND is_read = false`,
        [partnerId]
      );
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    await pool.query(
      `UPDATE partner_notifications SET is_read = true WHERE id = $1 AND partner_id = $2`,
      [id, partnerId]
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update notification";
    console.error("[partners/me/notifications PATCH] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
