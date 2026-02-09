import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";

export interface DiscountRecord {
  id: string;
  discount_code: string;
  haven_id: string;
  haven_name: string;
  tower: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  formatted_value: string;
  min_booking_amount: number | null;
  formatted_min: string | null;
  start_date: string;
  end_date: string;
  max_uses: number | null;
  used_count: number;
  usage_percentage: number;
  active: boolean;
  created_at: string;
}

export async function getAllDiscounts(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const haven_id = searchParams.get("haven_id");
    const active = searchParams.get("active");

    let query = `
      SELECT
        d.id,
        d.code as discount_code,
        d.haven_id,
        h.haven_name,
        h.tower,
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
        d.created_at
      FROM discounts d
      LEFT JOIN havens h ON d.haven_id = h.uuid_id
    `;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (haven_id && haven_id !== 'null') {
      conditions.push(`d.haven_id = $${paramCount}`);
      values.push(haven_id);
      paramCount++;
    }

    if (active === 'true') {
      conditions.push(`d.active = true`);
    } else if (active === 'false') {
      conditions.push(`d.active = false`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY d.created_at DESC";

    const result = await pool.query(query, values);

    const formattedRows = result.rows.map((row: any) => ({
      ...row,
      formatted_value: row.discount_type === 'percentage'
        ? `${row.discount_value}%`
        : `₱${parseFloat(row.discount_value).toLocaleString('en-PH')}`,
      formatted_min: row.min_booking_amount
        ? `₱${parseFloat(row.min_booking_amount).toLocaleString('en-PH')}`
        : 'N/A',
      usage_percentage: row.max_uses ? Math.round((row.used_count / row.max_uses) * 100) : 0
    }));

    return NextResponse.json({
      success: true,
      data: formattedRows,
      count: formattedRows.length,
    });
  } catch (error: unknown) {
    console.error("Error getting discounts:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get discounts";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function getDiscountById(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const params = await ctx.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Discount ID is required" },
        { status: 400 }
      );
    }

    const query = `
      SELECT
        d.*,
        h.haven_name,
        h.tower
      FROM discounts d
      LEFT JOIN havens h ON d.haven_id = h.uuid_id
      WHERE d.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Discount not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: unknown) {
    console.error("Error getting discount:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get discount";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function createDiscount(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const {
      code,
      haven_id,
      name,
      description,
      discount_type,
      discount_value,
      min_booking_amount,
      start_date,
      end_date,
      max_uses,
    } = body;

    if (!code || !haven_id || !name || !discount_type || !discount_value) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO discounts (
        code, haven_id, name, description, discount_type,
        discount_value, min_booking_amount, start_date, end_date, max_uses
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(query, [
      code,
      haven_id,
      name,
      description || null,
      discount_type,
      discount_value,
      min_booking_amount || null,
      start_date,
      end_date,
      max_uses || null,
    ]);

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating discount:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create discount";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function updateDiscount(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const {
      id,
      name,
      description,
      discount_type,
      discount_value,
      min_booking_amount,
      start_date,
      end_date,
      max_uses,
      active,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Discount ID is required" },
        { status: 400 }
      );
    }

    const query = `
      UPDATE discounts
      SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        discount_type = COALESCE($4, discount_type),
        discount_value = COALESCE($5, discount_value),
        min_booking_amount = COALESCE($6, min_booking_amount),
        start_date = COALESCE($7, start_date),
        end_date = COALESCE($8, end_date),
        max_uses = COALESCE($9, max_uses),
        active = COALESCE($10, active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      name,
      description,
      discount_type,
      discount_value,
      min_booking_amount,
      start_date,
      end_date,
      max_uses,
      active,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Discount not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: unknown) {
    console.error("Error updating discount:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update discount";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function deleteDiscount(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Discount ID is required" },
        { status: 400 }
      );
    }

    const query = "DELETE FROM discounts WHERE id = $1 RETURNING id";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Discount not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Discount deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting discount:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete discount";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function toggleDiscountStatus(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { id, active } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Discount ID is required" },
        { status: 400 }
      );
    }

    const query = `
      UPDATE discounts
      SET active = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id, active]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Discount not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: unknown) {
    console.error("Error toggling discount status:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to toggle discount status";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
