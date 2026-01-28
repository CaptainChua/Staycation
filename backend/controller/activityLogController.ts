import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";

export interface ActivityLog {
  id?: string;
  // Either one of these may be provided depending on which table to use.
  employment_id?: string;
  employee_id?: string;
  // Allow the common set of action types but also accept arbitrary strings.
  action_type:
    | "login"
    | "logout"
    | "task_complete"
    | "task_pending"
    | "update"
    | "other"
    | string;
  action: string;
  details?: string;
  // Optional entity info (used when logging employee_activity_logs)
  entity_type?: string | null;
  entity_id?: string | null;
  created_at?: string;
}

// CREATE Activity Log
export const createActivityLog = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const {
      employment_id,
      employee_id,
      action_type,
      details,
      entity_type,
      entity_id,
    } = body || {};

    // Support `description` in payload as an alias for `action` / `details`
    const description = body?.action ?? body?.description ?? details ?? null;

    // Require either a staff employment id OR an employee id, plus action type and a description.
    if ((!employment_id && !employee_id) || !action_type || !description) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: employment_id|employee_id, action_type, description",
        },
        { status: 400 },
      );
    }

    // Try to capture client metadata where available
    const headers = req.headers;
    const ipAddress =
      headers.get("x-forwarded-for") ||
      headers.get("x-real-ip") ||
      headers.get("cf-connecting-ip") ||
      null;
    const userAgent = headers.get("user-agent") || null;

    // If an employee_id is provided, write to employee_activity_logs (newer table)
    if (employee_id) {
      const empQuery = `
        INSERT INTO employee_activity_logs
          (employee_id, activity_type, description, entity_type, entity_id, ip_address, user_agent, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
        RETURNING *
      `;

      const empValues = [
        employee_id,
        action_type,
        description,
        entity_type ?? null,
        entity_id ?? null,
        ipAddress,
        userAgent,
      ];

      const result = await pool.query(empQuery, empValues);

      console.log("✅ Employee Activity Log Created:", result.rows[0]);

      return NextResponse.json(
        {
          success: true,
          data: result.rows[0],
          message: "Employee activity log created successfully",
        },
        { status: 201 },
      );
    }

    // Fallback: existing staff activity logs path (backwards compatible)
    const query = `
      INSERT INTO staff_activity_logs (employment_id, action_type, action, details, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;

    const values = [
      employment_id,
      action_type,
      description,
      details ?? description ?? null,
    ];
    const result = await pool.query(query, values);

    console.log("✅ Activity Log Created:", result.rows[0]);

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        message: "Activity log created successfully",
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.log("❌ Error creating activity log:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: errMsg || "Failed to create activity log",
      },
      { status: 500 },
    );
  }
};

// GET All Activity Logs with Employee Details
export const getAllActivityLogs = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const action_type = searchParams.get("action_type");
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";

    let query = `
      SELECT
        al.id,
        al.employment_id,
        al.action_type,
        al.action,
        al.details,
        al.created_at,
        e.first_name,
        e.last_name,
        e.role,
        e.profile_image_url
      FROM staff_activity_logs al
      LEFT JOIN employees e ON al.employment_id = e.id
    `;

    const values: unknown[] = [];
    let paramCount = 1;

    if (action_type) {
      query += ` WHERE al.action_type = $${paramCount}`;
      values.push(action_type);
      paramCount++;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, values);

    console.log(`✅ Retrieved ${result.rows.length} activity logs`);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error: unknown) {
    console.log("❌ Error getting activity logs:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: errMsg || "Failed to get activity logs",
      },
      { status: 500 },
    );
  }
};

// GET Activity Stats
export const getActivityStats = async (): Promise<NextResponse> => {
  try {
    // Get counts of employees by role and status
    const statsQuery = `
      SELECT
        role,
        status,
        COUNT(*) as count
      FROM employees
      GROUP BY role, status
    `;

    const statsResult = await pool.query(statsQuery);

    // Calculate stats
    const stats = {
      active_csr: 0,
      active_cleaners: 0,
      logged_out: 0,
      total: 0,
    };

    statsResult.rows.forEach((row: Record<string, unknown>) => {
      const count = parseInt(String(row.count ?? "0"), 10);
      stats.total += count;

      const status = String(row.status ?? "");
      const role = String(row.role ?? "");

      if (status === "active") {
        if (role === "CSR" || role === "Csr") {
          stats.active_csr += count;
        } else if (role === "Cleaner") {
          stats.active_cleaners += count;
        }
      } else if (status === "inactive") {
        stats.logged_out += count;
      }
    });

    console.log("✅ Activity Stats:", stats);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    console.log("❌ Error getting activity stats:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: errMsg || "Failed to get activity stats",
      },
      { status: 500 },
    );
  }
};

// DELETE Activity Log
export const deleteActivityLog = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Activity log ID is required",
        },
        { status: 400 },
      );
    }

    const query = `DELETE FROM staff_activity_logs WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Activity log not found",
        },
        { status: 404 },
      );
    }

    console.log("✅ Activity log deleted:", result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "Activity log deleted successfully",
    });
  } catch (error: unknown) {
    console.log("❌ Error deleting activity log:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: errMsg || "Failed to delete activity log",
      },
      { status: 500 },
    );
  }
};
