import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { requireAdmin } from "@/backend/utils/requireAdmin";

// GET /api/admin/partner-messages/[threadId] — full conversation for one thread
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ threadId: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const { threadId } = await ctx.params;
    const result = await pool.query(
      `SELECT
        m.id, m.sender, m.sender_name, m.body, m.is_read, m.created_at
       FROM partner_messages m
       WHERE m.thread_id = $1
       ORDER BY m.created_at ASC`,
      [threadId]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load thread";
    console.error("[admin/partner-messages/threadId] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
