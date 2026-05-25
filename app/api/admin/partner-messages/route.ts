import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { requireAdmin } from "@/backend/utils/requireAdmin";

// GET /api/admin/partner-messages
// All partner message threads across every partner, for owner Messages tab
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
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
// Send a message as staff to a partner thread.
//
// Accepts EITHER:
//   - { thread_id, body, sender_name? }              — reply in an existing thread
//   - { partner_id, body, sender_name? }             — start (or reuse) the
//       default staff↔partner thread. Created on the fly the first time a
//       member of staff messages a partner from the new-message picker.
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const { thread_id: requestedThreadId, partner_id, body, sender_name } = await req.json();

    if (!body?.trim()) {
      return NextResponse.json(
        { success: false, error: "body is required" },
        { status: 400 }
      );
    }
    if (!requestedThreadId && !partner_id) {
      return NextResponse.json(
        { success: false, error: "thread_id or partner_id is required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Resolve the thread id — either trust the one the caller passed, or
      // find-or-create the default 'support' thread for the given partner.
      let threadId: string = requestedThreadId;
      if (!threadId) {
        const existing = await client.query(
          `SELECT id FROM partner_message_threads
            WHERE partner_id = $1 AND thread_key = 'support'
            LIMIT 1`,
          [partner_id]
        );

        if (existing.rows.length > 0) {
          threadId = existing.rows[0].id;
        } else {
          // Pull display fields from partners_information so the thread renders
          // with a real name on both ends, falling back to the email.
          const partnerInfo = await client.query(
            `SELECT pi.partner_fullname, pa.partner_email
               FROM partners_account pa
               LEFT JOIN partners_information pi ON pi.partner_id = pa.id
              WHERE pa.id = $1
              LIMIT 1`,
            [partner_id]
          );
          if (partnerInfo.rows.length === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json(
              { success: false, error: "Partner not found" },
              { status: 404 }
            );
          }
          const displayName =
            partnerInfo.rows[0].partner_fullname?.trim() ||
            partnerInfo.rows[0].partner_email ||
            "Partner";

          const newThread = await client.query(
            `INSERT INTO partner_message_threads
               (partner_id, thread_key, display_name, role_label)
             VALUES ($1, 'support', $2, 'Support')
             RETURNING id`,
            [partner_id, displayName]
          );
          threadId = newThread.rows[0].id;
        }
      }

      const insertResult = await client.query(
        `INSERT INTO partner_messages (thread_id, sender, sender_name, body, is_read)
         VALUES ($1, 'staff', $2, $3, false)
         RETURNING *`,
        [threadId, sender_name || "Support", body.trim()]
      );

      const preview = body.trim().slice(0, 140);
      await client.query(
        `UPDATE partner_message_threads
         SET last_message_preview = $2,
             last_message_at = NOW(),
             unread_count = unread_count + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [threadId, preview]
      );

      await client.query("COMMIT");
      return NextResponse.json({
        success: true,
        data: { ...insertResult.rows[0], thread_id: threadId },
      });
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
