import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PUT /api/haven/addon-categories/:id
export async function PUT(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { name, icon, sort_order } = await req.json();

    const result = await pool.query(
      `UPDATE haven_addon_categories
          SET name = COALESCE($2, name),
              icon = COALESCE($3, icon),
              sort_order = COALESCE($4, sort_order),
              updated_at = NOW()
        WHERE id = $1
        RETURNING id::text, haven_id::text, name, icon, sort_order`,
      [
        id,
        name ? String(name).trim() : null,
        icon ? String(icon).trim() : null,
        sort_order != null ? Number(sort_order) : null,
      ],
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[addon-categories PUT]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/haven/addon-categories/:id
// Deleting the category also cascades to remove FK reference on items
// (items become uncategorized via ON DELETE SET NULL).
export async function DELETE(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    await pool.query(`DELETE FROM haven_addon_categories WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[addon-categories DELETE]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
