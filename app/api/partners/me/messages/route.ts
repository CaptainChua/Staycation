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

// Default display metadata for each thread_key, used when the partner starts
// a brand-new conversation (no thread exists yet).
const THREAD_DEFAULTS: Record<
  string,
  { display_name: string; role_label: string; avatar_initials: string; avatar_color: string; is_online: boolean }
> = {
  support: {
    display_name: "Staycation Haven Support",
    role_label: "Customer service · 24/7",
    avatar_initials: "S",
    avatar_color: "primary",
    is_online: true,
  },
  manager: {
    display_name: "Account Manager",
    role_label: "Your account manager",
    avatar_initials: "AM",
    avatar_color: "gold",
    is_online: true,
  },
  billing: {
    display_name: "Payouts & Billing",
    role_label: "Finance team",
    avatar_initials: "₱",
    avatar_color: "green",
    is_online: false,
  },
  verify: {
    display_name: "Listing Review Team",
    role_label: "Approvals · Mon–Sat",
    avatar_initials: "LR",
    avatar_color: "blue",
    is_online: false,
  },
};

// POST: partner sends a message.
//   - Pass `thread_id` to append to an existing conversation.
//   - Pass `thread_key` (e.g. "support") to start a new conversation; the
//     thread is upserted on (partner_id, thread_key).
export async function POST(req: NextRequest) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { thread_id, thread_key, body } = await req.json();
    if (!body?.trim()) {
      return NextResponse.json({ success: false, error: "body is required" }, { status: 400 });
    }
    if (!thread_id && !thread_key) {
      return NextResponse.json(
        { success: false, error: "Either thread_id or thread_key is required" },
        { status: 400 }
      );
    }

    let resolvedThreadId = thread_id as string | undefined;

    // Upsert path — partner is starting a new conversation by thread_key.
    if (!resolvedThreadId && thread_key) {
      const defaults = THREAD_DEFAULTS[thread_key];
      if (!defaults) {
        return NextResponse.json(
          { success: false, error: `Unknown thread_key: ${thread_key}` },
          { status: 400 }
        );
      }
      const upsert = await pool.query(
        `INSERT INTO partner_message_threads
           (partner_id, thread_key, display_name, role_label, avatar_initials, avatar_color, is_online)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (partner_id, thread_key) DO UPDATE
           SET updated_at = NOW()
         RETURNING id::text`,
        [
          partnerId,
          thread_key,
          defaults.display_name,
          defaults.role_label,
          defaults.avatar_initials,
          defaults.avatar_color,
          defaults.is_online,
        ]
      );
      resolvedThreadId = upsert.rows[0].id;
    } else {
      // Existing thread path — confirm ownership.
      const ownership = await pool.query(
        `SELECT id FROM partner_message_threads WHERE id = $1 AND partner_id = $2`,
        [resolvedThreadId, partnerId]
      );
      if (ownership.rowCount === 0) {
        return NextResponse.json({ success: false, error: "Thread not found" }, { status: 404 });
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertResult = await client.query(
        `INSERT INTO partner_messages (thread_id, sender, body, is_read)
         VALUES ($1, 'partner', $2, true)
         RETURNING *`,
        [resolvedThreadId, body.trim()]
      );

      const preview = body.trim().slice(0, 140);
      await client.query(
        `UPDATE partner_message_threads
         SET last_message_preview = $2,
             last_message_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [resolvedThreadId, preview]
      );

      await client.query("COMMIT");
      return NextResponse.json({
        success: true,
        data: { ...insertResult.rows[0], thread_id: resolvedThreadId },
      });
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
