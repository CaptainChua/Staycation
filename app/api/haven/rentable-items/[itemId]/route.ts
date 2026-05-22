import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";

interface RouteContext {
  params: Promise<{ itemId: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { itemId } = await params;
    const body = await req.json();
    const { name, icon, price_per_night } = body;
    // Distinguish "client didn't send the field" (preserve existing) from
    // "client sent null" (explicitly clear the uploaded icon).
    const iconUrlProvided = Object.prototype.hasOwnProperty.call(body, "icon_url");
    const nextIconUrl: string | null = iconUrlProvided ? (body.icon_url ?? null) : null;

    if (!name || price_per_night == null) {
      return NextResponse.json({ success: false, error: "name and price_per_night are required" }, { status: 400 });
    }

    const result = iconUrlProvided
      ? await pool.query(
          `UPDATE haven_rentable_items
           SET name = $1, icon = $2, icon_url = $3, price_per_night = $4, updated_at = NOW()
           WHERE id = $5
           RETURNING id, haven_id, name, icon, icon_url, price_per_night, is_active`,
          [name.trim(), (icon || "default").trim(), nextIconUrl, parseFloat(price_per_night), parseInt(itemId)],
        )
      : await pool.query(
          `UPDATE haven_rentable_items
           SET name = $1, icon = $2, price_per_night = $3, updated_at = NOW()
           WHERE id = $4
           RETURNING id, haven_id, name, icon, icon_url, price_per_night, is_active`,
          [name.trim(), (icon || "default").trim(), parseFloat(price_per_night), parseInt(itemId)],
        );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("[rentable-items PUT]", error);
    return NextResponse.json({ success: false, error: "Failed to update rentable item" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { itemId } = await params;
    await pool.query(
      `UPDATE haven_rentable_items SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [parseInt(itemId)],
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[rentable-items DELETE]", error);
    return NextResponse.json({ success: false, error: "Failed to delete rentable item" }, { status: 500 });
  }
}
