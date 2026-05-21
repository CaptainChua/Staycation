import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const result = await pool.query(
      `SELECT id, haven_id, name, icon, price_per_night, is_active, created_at
       FROM haven_rentable_items
       WHERE haven_id = $1 AND is_active = true
       ORDER BY id ASC`,
      [id],
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[rentable-items GET]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { name, icon, price_per_night } = await req.json();

    if (!name || price_per_night == null) {
      return NextResponse.json({ success: false, error: "name and price_per_night are required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO haven_rentable_items (haven_id, name, icon, price_per_night)
       VALUES ($1, $2, $3, $4)
       RETURNING id, haven_id, name, icon, price_per_night, is_active`,
      [id, name.trim(), (icon || "🛎️").trim(), parseFloat(price_per_night)],
    );

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[rentable-items POST]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
