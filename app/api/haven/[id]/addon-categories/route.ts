import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/haven/:id/addon-categories
// Returns categories for the haven, each with its items nested.
export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const result = await pool.query(
      `SELECT
         c.id::text,
         c.haven_id::text,
         c.name,
         c.icon,
         c.sort_order,
         c.created_at,
         COALESCE(
           (
             SELECT json_agg(
               json_build_object(
                 'id',              i.id,
                 'name',            i.name,
                 'icon',            i.icon,
                 'price_per_night', i.price_per_night,
                 'is_active',       i.is_active,
                 'category_id',     i.category_id
               )
               ORDER BY i.id
             )
             FROM haven_rentable_items i
             WHERE i.category_id = c.id AND i.is_active = true
           ),
           '[]'::json
         ) AS items
       FROM haven_addon_categories c
       WHERE c.haven_id = $1
       ORDER BY c.sort_order ASC, c.created_at ASC`,
      [id],
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[addon-categories GET]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/haven/:id/addon-categories
// Body: { name, icon?, sort_order? }
export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { name, icon, sort_order } = await req.json();

    if (!name || !String(name).trim()) {
      return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO haven_addon_categories (haven_id, name, icon, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING id::text, haven_id::text, name, icon, sort_order, created_at`,
      [id, String(name).trim(), (icon || "📦").trim(), Number(sort_order) || 0],
    );

    return NextResponse.json(
      { success: true, data: { ...result.rows[0], items: [] } },
      { status: 201 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[addon-categories POST]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
