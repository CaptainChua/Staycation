import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";

export interface RoomDiscount {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_booking_amount: number | null;
  start_date: string;
  end_date: string;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  applies_to_all_properties: boolean;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const havenId = searchParams.get("havenId");
    const userId = searchParams.get("userId");

    if (!havenId) {
      return NextResponse.json(
        { success: false, error: "Haven ID is required" },
        { status: 400 }
      );
    }

    // Query to get active discounts for this specific room
    // Logic: 
    // 1. If discount has entries in discount_havens, check if this room is included
    // 2. If discount has NO entries in discount_havens, it applies to ALL properties
    const query = `
      SELECT DISTINCT
        d.id,
        d.code,
        d.name,
        d.description,
        d.discount_type,
        d.discount_value,
        d.min_booking_amount,
        d.start_date,
        d.end_date,
        d.max_uses,
        d.used_count,
        d.active,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM discount_havens dh 
            WHERE dh.discount_id = d.id
          ) THEN true
          ELSE false
        END as has_property_restrictions
      FROM discounts d
      WHERE d.active = true
        AND d.start_date <= NOW()
        AND d.end_date >= NOW()
        AND (d.max_uses IS NULL OR d.used_count < d.max_uses)
        AND (
          -- Discount applies to all properties (no entries in discount_havens)
          NOT EXISTS (
            SELECT 1 FROM discount_havens dh 
            WHERE dh.discount_id = d.id
          )
          OR 
          -- Discount applies specifically to this property
          EXISTS (
            SELECT 1 FROM discount_havens dh 
            WHERE dh.discount_id = d.id AND dh.haven_id = $1
          )
        )
      ORDER BY d.discount_value DESC
    `;

    const result = await pool.query(query, [havenId]);

    const discounts: RoomDiscount[] = result.rows.map((row: any) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      discount_type: row.discount_type,
      discount_value: parseFloat(row.discount_value),
      min_booking_amount: row.min_booking_amount ? parseFloat(row.min_booking_amount) : null,
      start_date: row.start_date,
      end_date: row.end_date,
      max_uses: row.max_uses ? parseInt(row.max_uses) : null,
      used_count: parseInt(row.used_count),
      active: row.active,
      applies_to_all_properties: !row.has_property_restrictions,
      has_property_restrictions: row.has_property_restrictions,
    }));

    return NextResponse.json({
      success: true,
      data: discounts,
      count: discounts.length,
    });
  } catch (error: unknown) {
    console.error("Error getting room discounts:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get room discounts";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
