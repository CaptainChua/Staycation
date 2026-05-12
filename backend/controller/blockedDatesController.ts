import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";

export interface BlockedDate {
  id: string;
  haven_id: string;
  from_date: string;
  to_date: string;
  reason?: string;
  created_at: string;
  haven_name?: string;
  tower?: string;
  floor?: string;
}

async function ensureBlockedDatesTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blocked_dates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      haven_id UUID NOT NULL REFERENCES havens(uuid_id) ON DELETE CASCADE,
      from_date DATE NOT NULL,
      to_date DATE NOT NULL,
      reason TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_blocked_dates_haven_id ON blocked_dates(haven_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_blocked_dates_range ON blocked_dates(from_date, to_date)`);
}

async function hasBlockedDateStatusColumn(): Promise<boolean> {
  const result = await pool.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blocked_dates' AND column_name = 'status' LIMIT 1
  `);
  return result.rows.length > 0;
}

// Get all blocked dates with optional filtering
export async function getAllBlockedDates(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureBlockedDatesTable();

    const { searchParams } = new URL(req.url);
    const haven_id = searchParams.get("haven_id");
    // 'active' | 'inactive' | null (null = return all, used by management page)
    const statusFilter = searchParams.get("status");

    let query = `
      SELECT bd.*, h.haven_name, h.tower, h.floor
      FROM blocked_dates bd
      LEFT JOIN havens h ON bd.haven_id = h.uuid_id
    `;

    const conditions: string[] = [];
    const values: string[] = [];
    let paramCount = 1;

    if (haven_id) {
      conditions.push(`bd.haven_id = $${paramCount}`);
      values.push(haven_id);
      paramCount++;
    }

    const statusColumnExists = await hasBlockedDateStatusColumn();
    if (statusColumnExists && statusFilter) {
      conditions.push(`bd.status = $${paramCount}`);
      values.push(statusFilter);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY bd.from_date DESC";

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error: unknown) {
    console.error("Error getting blocked dates:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get blocked dates";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Get blocked date by ID
export async function getBlockedDateById(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const params = await ctx.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Blocked date ID is required" },
        { status: 400 }
      );
    }

    const query = `
      SELECT bd.*, h.haven_name, h.tower, h.floor
      FROM blocked_dates bd
      LEFT JOIN havens h ON bd.haven_id = h.uuid_id
      WHERE bd.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Blocked date not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: unknown) {
    console.error("Error getting blocked date:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get blocked date";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Create new blocked date
export async function createBlockedDate(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureBlockedDatesTable();
    const body = await req.json();
    const { haven_id, from_date, to_date, reason, status } = body;

    if (!haven_id || !from_date || !to_date) {
      return NextResponse.json(
        { success: false, error: "Haven ID, from_date, and to_date are required" },
        { status: 400 }
      );
    }

    // Ensure from_date is before or equal to to_date
    const fromDateObj = new Date(from_date);
    const toDateObj = new Date(to_date);

    const actualFromDate = fromDateObj <= toDateObj ? from_date : to_date;
    const actualToDate = fromDateObj <= toDateObj ? to_date : from_date;

    const statusColumnExists = await hasBlockedDateStatusColumn();

    const query = statusColumnExists
      ? `
        INSERT INTO blocked_dates (haven_id, from_date, to_date, reason, status, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `
      : `
        INSERT INTO blocked_dates (haven_id, from_date, to_date, reason, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;

    const values = statusColumnExists
      ? [haven_id, actualFromDate, actualToDate, reason || null, status || "active"]
      : [haven_id, actualFromDate, actualToDate, reason || null];

    const result = await pool.query(query, values);

    console.log("Blocked date created:", result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "Blocked date created successfully",
    });
  } catch (error: unknown) {
    console.error("Error creating blocked date:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create blocked date";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Update blocked date
export async function updateBlockedDate(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureBlockedDatesTable();
    const body = await req.json();
    const { id, haven_id, from_date, to_date, reason, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Blocked date ID is required" },
        { status: 400 }
      );
    }

    // Ensure from_date is before or equal to to_date
    const fromDateObj = new Date(from_date);
    const toDateObj = new Date(to_date);

    const actualFromDate = fromDateObj <= toDateObj ? from_date : to_date;
    const actualToDate = fromDateObj <= toDateObj ? to_date : from_date;

    const statusColumnExists = await hasBlockedDateStatusColumn();

    const query = statusColumnExists
      ? `
        UPDATE blocked_dates
        SET haven_id = COALESCE($2, haven_id),
            from_date = COALESCE($3, from_date),
            to_date = COALESCE($4, to_date),
            reason = $5,
            status = COALESCE($6, status)
        WHERE id = $1
        RETURNING *
      `
      : `
        UPDATE blocked_dates
        SET haven_id = COALESCE($2, haven_id),
            from_date = COALESCE($3, from_date),
            to_date = COALESCE($4, to_date),
            reason = $5
        WHERE id = $1
        RETURNING *
      `;

    const values = statusColumnExists
      ? [id, haven_id, actualFromDate, actualToDate, reason || null, status || null]
      : [id, haven_id, actualFromDate, actualToDate, reason || null];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Blocked date not found" },
        { status: 404 }
      );
    }

    console.log("Blocked date updated:", result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "Blocked date updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating blocked date:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update blocked date";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Delete blocked date
export async function deleteBlockedDate(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureBlockedDatesTable();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Blocked date ID is required" },
        { status: 400 }
      );
    }

    const query = `DELETE FROM blocked_dates WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Blocked date not found" },
        { status: 404 }
      );
    }

    console.log("Blocked date deleted:", result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "Blocked date deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting blocked date:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete blocked date";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
