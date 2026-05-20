import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

const ALLOWED_SOURCES = new Set(["airbnb", "booking.com", "agoda", "vrbo", "other"]);

// GET: list a haven's iCal feeds
export async function GET(_req: NextRequest, ctx: { params: Promise<{ havenId: string }> }) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { havenId } = await ctx.params;
    const owns = await pool.query(
      `SELECT 1 FROM havens WHERE uuid_id = $1 AND partner_id = $2`,
      [havenId, partnerId]
    );
    if (owns.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const result = await pool.query(
      `SELECT id::text, haven_id, source, label, url, is_active,
              last_synced_at, last_status, last_error, last_event_count, created_at
       FROM haven_ical_feeds
       WHERE haven_id = $1
       ORDER BY created_at DESC`,
      [havenId]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "42P01") {
      return NextResponse.json({ success: true, data: [] });
    }
    const msg = err instanceof Error ? err.message : "Failed to load feeds";
    console.error("[ical-feeds GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST: add a new feed
export async function POST(req: NextRequest, ctx: { params: Promise<{ havenId: string }> }) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { havenId } = await ctx.params;
    const body = await req.json();
    const source = String(body.source || "").toLowerCase().trim();
    const url = String(body.url || "").trim();
    const label = body.label ? String(body.label).slice(0, 100) : null;

    if (!ALLOWED_SOURCES.has(source)) {
      return NextResponse.json(
        { success: false, error: `source must be one of: ${Array.from(ALLOWED_SOURCES).join(", ")}` },
        { status: 400 }
      );
    }
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        { success: false, error: "url must be a valid http(s) iCal link" },
        { status: 400 }
      );
    }

    // Ownership
    const owns = await pool.query(
      `SELECT 1 FROM havens WHERE uuid_id = $1 AND partner_id = $2`,
      [havenId, partnerId]
    );
    if (owns.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    try {
      const inserted = await pool.query(
        `INSERT INTO haven_ical_feeds (haven_id, source, label, url)
         VALUES ($1, $2, $3, $4)
         RETURNING id::text, source, label, url, is_active, last_synced_at, last_status, last_event_count, created_at`,
        [havenId, source, label, url]
      );
      return NextResponse.json({ success: true, data: inserted.rows[0] });
    } catch (dbErr: unknown) {
      const code = (dbErr as { code?: string })?.code;
      if (code === "23505") {
        return NextResponse.json(
          { success: false, error: "This feed URL is already added for this haven." },
          { status: 409 }
        );
      }
      throw dbErr;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to add feed";
    console.error("[ical-feeds POST] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
