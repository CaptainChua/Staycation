import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

// GET /api/partners/me/payouts/:id/attachments
// Partner reads evidence attachments for one of THEIR OWN payouts.
// We verify ownership server-side so a partner can't peek at another's payout.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id: payoutId } = await params;

    const ownership = await pool.query<{ partner_id: string }>(
      `SELECT partner_id FROM partner_payouts WHERE id = $1`,
      [payoutId]
    );
    if (ownership.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Payout not found" }, { status: 404 });
    }
    if (ownership.rows[0].partner_id !== partnerId) {
      return NextResponse.json({ success: false, error: "Not your payout" }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT id, payout_id, label, file_url, mime_type, file_size_bytes, uploaded_at
         FROM partner_payout_attachments
        WHERE payout_id = $1
        ORDER BY uploaded_at DESC`,
      [payoutId]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load attachments";
    console.error("[partners/me/payouts/:id/attachments GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
