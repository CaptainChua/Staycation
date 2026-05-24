import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET is public — guest checkout needs to list a haven's add-ons without logging in.
// Also returns the haven's partner_id so the checkout can decide whether to apply
// a fallback (owner-direct havens fall back to inventory; partner havens don't).
// Defensive: if the category_id column isn't there yet (migration not run),
// falls back to the old SELECT so the existing UI keeps loading.
export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;

    let itemsQuery = pool.query(
      `SELECT id, haven_id, category_id, name, icon, icon_url, price_per_night, is_active, created_at
       FROM haven_rentable_items
       WHERE haven_id = $1 AND is_active = true
       ORDER BY id ASC`,
      [id],
    );

    const havenQuery = pool.query<{ partner_id: string | null }>(
      `SELECT partner_id FROM havens WHERE uuid_id = $1`,
      [id],
    );

    let itemsResult;
    try {
      itemsResult = await itemsQuery;
    } catch {
      itemsResult = await pool.query(
        `SELECT id, haven_id, NULL::uuid AS category_id, name, icon, icon_url, price_per_night, is_active, created_at
         FROM haven_rentable_items
         WHERE haven_id = $1 AND is_active = true
         ORDER BY id ASC`,
        [id],
      );
    }

    const havenResult = await havenQuery;
    const havenPartnerId = havenResult.rows[0]?.partner_id ?? null;

    return NextResponse.json({
      success: true,
      data: itemsResult.rows,
      haven_partner_id: havenPartnerId,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[rentable-items GET]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/haven/:id/rentable-items
// Body: { name, icon?, icon_url?, price_per_night, category_id? }
export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { name, icon, icon_url, price_per_night, category_id } = await req.json();

    if (!name || price_per_night == null) {
      return NextResponse.json({ success: false, error: "name and price_per_night are required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO haven_rentable_items (haven_id, category_id, name, icon, icon_url, price_per_night)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, haven_id, category_id, name, icon, icon_url, price_per_night, is_active`,
      [
        id,
        category_id || null,
        name.trim(),
        (icon || "🛎️").trim(),
        icon_url || null,
        parseFloat(price_per_night),
      ],
    );

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[rentable-items POST]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
