import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";

// GET /api/admin/partner-messages
// All partner message threads across every partner, for owner Messages tab
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.thread_key,
        t.display_name,
        t.role_label,
        t.last_message_preview,
        t.last_message_at,
        t.unread_count,
        t.is_online,
        partner.partner_email,
        pi.partner_fullname AS partner_name,
        (
          SELECT COUNT(*)::int FROM partner_messages m
          WHERE m.thread_id = t.id
        ) AS message_count
      FROM partner_message_threads t
      INNER JOIN partners_account partner ON partner.id = t.partner_id
      LEFT JOIN partners_information pi ON pi.partner_id = t.partner_id
      ORDER BY t.last_message_at DESC
    `);

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    // 42P01 = undefined_table — partner messaging tables haven't been created yet.
    // Return empty list so the UI shows the empty state instead of crashing.
    if (code === "42P01") {
      console.warn("[admin/partner-messages GET] partner_message_threads table missing — run partners_full_backend.sql in Neon to enable messaging.");
      return NextResponse.json({ success: true, data: [] });
    }
    const msg = err instanceof Error ? err.message : "Failed to load partner messages";
    console.error("[admin/partner-messages GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/admin/partner-messages
// Send a message as staff to a partner thread
export async function POST(req: NextRequest) {
  try {
    const { thread_id, body, sender_name } = await req.json();
    if (!thread_id || !body?.trim()) {
      return NextResponse.json(
        { success: false, error: "thread_id and body are required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertResult = await client.query(
        `INSERT INTO partner_messages (thread_id, sender, sender_name, body, is_read)
         VALUES ($1, 'staff', $2, $3, false)
         RETURNING *`,
        [thread_id, sender_name || "Support", body.trim()]
      );

      const preview = body.trim().slice(0, 140);
      await client.query(
        `UPDATE partner_message_threads
         SET last_message_preview = $2,
             last_message_at = NOW(),
             unread_count = unread_count + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [thread_id, preview]
      );

      await client.query("COMMIT");
      return NextResponse.json({ success: true, data: insertResult.rows[0] });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send message";
    console.error("[admin/partner-messages POST] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// GET /api/admin/partner-messages/[thread_id] — fetch one thread with all messages
// We'll handle this via query param instead of nested route for simplicity
