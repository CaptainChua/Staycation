import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

// GET: list threads with their last message + unread count
export async function GET() {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const threadsResult = await pool.query(
      `SELECT
        t.id,
        t.thread_key,
        t.display_name,
        t.role_label,
        t.avatar_initials,
        t.avatar_color,
        t.last_message_preview,
        t.last_message_at,
        t.unread_count,
        t.is_online,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', m.id,
                'sender', m.sender,
                'sender_name', m.sender_name,
                'body', m.body,
                'is_read', m.is_read,
                'created_at', m.created_at
              )
              ORDER BY m.created_at ASC
            )
            FROM partner_messages m
            WHERE m.thread_id = t.id
          ),
          '[]'::json
        ) AS messages
       FROM partner_message_threads t
       WHERE t.partner_id = $1
       ORDER BY t.last_message_at DESC`,
      [partnerId]
    );

    return NextResponse.json({ success: true, data: threadsResult.rows });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "42P01") {
      return NextResponse.json({ success: true, data: [] });
    }
    const msg = err instanceof Error ? err.message : "Failed to load messages";
    console.error("[partners/me/messages GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST: partner sends a message to a thread
export async function POST(req: NextRequest) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { thread_id, body } = await req.json();
    if (!thread_id || !body?.trim()) {
      return NextResponse.json(
        { success: false, error: "thread_id and body are required" },
        { status: 400 }
      );
    }

    // Confirm thread belongs to this partner
    const ownership = await pool.query(
      `SELECT id FROM partner_message_threads WHERE id = $1 AND partner_id = $2`,
      [thread_id, partnerId]
    );
    if (ownership.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Thread not found" }, { status: 404 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertResult = await client.query(
        `INSERT INTO partner_messages (thread_id, sender, body, is_read)
         VALUES ($1, 'partner', $2, true)
         RETURNING *`,
        [thread_id, body.trim()]
      );

      const preview = body.trim().slice(0, 140);
      await client.query(
        `UPDATE partner_message_threads
         SET last_message_preview = $2,
             last_message_at = NOW(),
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
    console.error("[partners/me/messages POST] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
