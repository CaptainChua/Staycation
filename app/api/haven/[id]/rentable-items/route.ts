import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/haven/:id/rentable-items
//   Returns active add-on items for the haven, including their category_id.
//   Defensive: if the category_id column isn't there yet (migration not run),
//   falls back to the old SELECT so the existing UI keeps loading.
export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    let result;
    try {
      result = await pool.query(
        `SELECT id, haven_id, category_id, name, icon, price_per_night, is_active, created_at
         FROM haven_rentable_items
         WHERE haven_id = $1 AND is_active = true
         ORDER BY id ASC`,
        [id],
      );
    } catch {
      result = await pool.query(
        `SELECT id, haven_id, NULL::uuid AS category_id, name, icon, price_per_night, is_active, created_at
         FROM haven_rentable_items
         WHERE haven_id = $1 AND is_active = true
         ORDER BY id ASC`,
        [id],
      );
    }
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[rentable-items GET]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/haven/:id/rentable-items
// Body: { name, icon?, price_per_night, category_id? }
export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { name, icon, price_per_night, category_id } = await req.json();

    if (!name || price_per_night == null) {
      return NextResponse.json({ success: false, error: "name and price_per_night are required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO haven_rentable_items (haven_id, category_id, name, icon, price_per_night)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, haven_id, category_id, name, icon, price_per_night, is_active`,
      [
        id,
        category_id || null,
        name.trim(),
        (icon || "🛎️").trim(),
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
