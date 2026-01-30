import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";

export interface CleaningTask {
  cleaning_id: string;
  booking_id: string;
  haven: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_in_time: string;
  check_out_date: string;
  check_out_time: string;
  cleaning_status: string;
  assigned_cleaner_id: string | null;
  cleaner_first_name: string | null;
  cleaner_last_name: string | null;
  cleaner_employment_id: string | null;
  cleaning_time_in: string | null;
  cleaning_time_out: string | null;
  cleaned_at: string | null;
  inspected_at: string | null;
}

// GET All Cleaning Tasks
export const getAllCleaningTasks = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    console.log("🔍 Controller: getAllCleaningTasks called");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    console.log("📋 Status filter:", status);

    let query = `
      SELECT
        bc.id as cleaning_id,
        b.booking_id,
        b.room_name as haven,
        bg.first_name as guest_first_name,
        bg.last_name as guest_last_name,
        bg.email as guest_email,
        bg.phone as guest_phone,
        b.check_in_date,
        b.check_in_time,
        b.check_out_date,
        b.check_out_time,
        bc.cleaning_status,
        bc.assigned_to as assigned_cleaner_id,
        e.first_name as cleaner_first_name,
        e.last_name as cleaner_last_name,
        e.employment_id as cleaner_employment_id,
        bc.cleaning_time_in,
        bc.cleaning_time_out,
        bc.cleaned_at,
        bc.inspected_at
      FROM booking_cleaning bc
      INNER JOIN booking b ON bc.booking_id = b.id
      LEFT JOIN booking_guests bg ON b.id = bg.booking_id
      LEFT JOIN employees e ON bc.assigned_to = e.id
      WHERE bg.id = (
        SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1
      )
    `;
    const values: string[] = [];

    if (status) {
      query += ` AND bc.cleaning_status = $1`;
      values.push(status);
    }

    query += " ORDER BY b.check_out_date DESC, b.check_out_time DESC";

    console.log("🗄️ Executing query:", query);
    console.log("📊 Query values:", values);

    const result = await pool.query(query, values);
    console.log(`✅ Retrieved ${result.rows.length} cleaning tasks`);
    console.log("📋 Sample data:", result.rows.slice(0, 2));

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.log("❌ Error getting cleaning tasks:", error);
    console.log("🔍 Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get cleaning tasks",
        details: String(error)
      },
      { status: 500 }
    );
  }
};

// GET Single Cleaning Task by ID
export const getCleaningTaskById = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments.pop() || segments.pop();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Cleaning task ID is required" },
        { status: 400 }
      );
    }

    const query = `
      SELECT
        bc.id as cleaning_id,
        b.booking_id,
        b.room_name as haven,
        bg.first_name as guest_first_name,
        bg.last_name as guest_last_name,
        bg.email as guest_email,
        bg.phone as guest_phone,
        b.check_in_date,
        b.check_in_time,
        b.check_out_date,
        b.check_out_time,
        bc.cleaning_status,
        bc.assigned_to as assigned_cleaner_id,
        e.first_name as cleaner_first_name,
        e.last_name as cleaner_last_name,
        e.employment_id as cleaner_employment_id,
        bc.cleaning_time_in,
        bc.cleaning_time_out,
        bc.cleaned_at,
        bc.inspected_at
      FROM booking_cleaning bc
      INNER JOIN booking b ON bc.booking_id = b.id
      LEFT JOIN booking_guests bg ON b.id = bg.booking_id
      LEFT JOIN employees e ON bc.assigned_to = e.id
      WHERE bc.id = $1
      AND bg.id = (
        SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1
      )
      LIMIT 1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cleaning task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.log("❌ Error getting cleaning task:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get cleaning task",
      },
      { status: 500 }
    );
  }
};

// Update Cleaning Task (assign cleaner, update status, etc.)
export const updateCleaningTask = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments.pop() || segments.pop();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Cleaning task ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      cleaning_status,
      assigned_to,
      cleaning_time_in,
      cleaning_time_out,
      cleaned_at,
      inspected_at,
    } = body;

    // Validate cleaning status if provided
    if (cleaning_status) {
      const validStatuses = ["pending", "in-progress", "cleaned", "inspected"];
      if (!validStatuses.includes(cleaning_status)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid cleaning status. Must be one of: pending, in-progress, cleaned, inspected",
          },
          { status: 400 }
        );
      }
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const params: (string | null)[] = [];
    let paramCount = 1;

    if (cleaning_status !== undefined) {
      updateFields.push(`cleaning_status = $${paramCount}`);
      params.push(cleaning_status);
      paramCount++;
    }

    if (assigned_to !== undefined) {
      updateFields.push(`assigned_to = $${paramCount}`);
      params.push(assigned_to);
      paramCount++;
    }

    if (cleaning_time_in !== undefined) {
      updateFields.push(`cleaning_time_in = $${paramCount}`);
      params.push(cleaning_time_in);
      paramCount++;
    }

    if (cleaning_time_out !== undefined) {
      updateFields.push(`cleaning_time_out = $${paramCount}`);
      params.push(cleaning_time_out);
      paramCount++;
    }

    if (cleaned_at !== undefined) {
      updateFields.push(`cleaned_at = $${paramCount}`);
      params.push(cleaned_at);
      paramCount++;
    }

    if (inspected_at !== undefined) {
      updateFields.push(`inspected_at = $${paramCount}`);
      params.push(inspected_at);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    params.push(id);

    const updateQuery = `
      UPDATE booking_cleaning
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updateResult = await pool.query(updateQuery, params);

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cleaning task not found" },
        { status: 404 }
      );
    }

    // Get the complete cleaning task data for response
    const selectQuery = `
      SELECT
        bc.id as cleaning_id,
        b.booking_id,
        b.room_name as haven,
        bg.first_name as guest_first_name,
        bg.last_name as guest_last_name,
        bg.email as guest_email,
        bg.phone as guest_phone,
        b.check_in_date,
        b.check_in_time,
        b.check_out_date,
        b.check_out_time,
        bc.cleaning_status,
        bc.assigned_to as assigned_cleaner_id,
        e.first_name as cleaner_first_name,
        e.last_name as cleaner_last_name,
        e.employment_id as cleaner_employment_id,
        bc.cleaning_time_in,
        bc.cleaning_time_out,
        bc.cleaned_at,
        bc.inspected_at
      FROM booking_cleaning bc
      INNER JOIN booking b ON bc.booking_id = b.id
      LEFT JOIN booking_guests bg ON b.id = bg.booking_id
      LEFT JOIN employees e ON bc.assigned_to = e.id
      WHERE bc.id = $1
      AND bg.id = (
        SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1
      )
      LIMIT 1
    `;

    const selectResult = await pool.query(selectQuery, [id]);

    console.log("✅ Cleaning task updated:", updateResult.rows[0]);

    return NextResponse.json({
      success: true,
      data: selectResult.rows[0] || updateResult.rows[0],
      message: "Cleaning task updated successfully",
    });
  } catch (error) {
    console.log("❌ Error updating cleaning task:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update cleaning task",
      },
      { status: 500 }
    );
  }
};
