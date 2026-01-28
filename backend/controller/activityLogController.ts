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
      INSERT INTO employee_activity_logs (employee_id, activity_type, description, entity_type, entity_id, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
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
        al.employee_id,
        al.activity_type,
        al.description,
        al.entity_type,
        al.entity_id,
        al.ip_address,
        al.user_agent,
        (al.created_at AT TIME ZONE 'Asia/Manila') as created_at,
        e.first_name,
        e.last_name,
        e.role,
        e.profile_image_url
      FROM employee_activity_logs al
      LEFT JOIN employees e ON al.employee_id = e.id
    `;

    const values: unknown[] = [];
    let paramCount = 1;
    const whereConditions: string[] = [];

    // Add employee_id filter
    if (employee_id) {
      whereConditions.push(`al.employee_id = $${paramCount}`);
      values.push(employee_id);
      paramCount++;
    }

    // Add activity_type filter
    if (action_type && action_type !== 'all') {
      whereConditions.push(`al.activity_type = $${paramCount}`);
      values.push(action_type.toUpperCase());
      paramCount++;
    }

    // Add search filter
    if (search) {
      whereConditions.push(`(
        al.activity_type ILIKE $${paramCount} OR 
        al.description ILIKE $${paramCount} OR 
        al.entity_type ILIKE $${paramCount} OR 
        e.first_name ILIKE $${paramCount} OR 
        e.last_name ILIKE $${paramCount}
      )`);
      values.push(`%${search}%`);
      paramCount++;
    }

    // Add date range filter (using Manila time)
    if (date_range && date_range !== 'all') {
      // Get current Manila time
      const now = new Date();
      const manilaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
      let startDate: Date | undefined;
      let endDate: Date = new Date(manilaTime);

      switch (date_range) {
        case 'today':
          startDate = new Date(manilaTime.getFullYear(), manilaTime.getMonth(), manilaTime.getDate());
          break;
        case 'yesterday':
          startDate = new Date(manilaTime.getFullYear(), manilaTime.getMonth(), manilaTime.getDate() - 1);
          endDate = new Date(manilaTime.getFullYear(), manilaTime.getMonth(), manilaTime.getDate());
          break;
        case 'last_7_days':
          startDate = new Date(manilaTime.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last_30_days':
          startDate = new Date(manilaTime.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          if (start_date) {
            startDate = new Date(start_date);
          }
          if (end_date) {
            endDate = new Date(end_date + 'T23:59:59.999Z');
          }
          break;
        default:
          startDate = new Date(manilaTime.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      if (startDate) {
        whereConditions.push(`(al.created_at AT TIME ZONE 'Asia/Manila') >= $${paramCount}`);
        values.push(startDate.toISOString());
        paramCount++;
      }

      if (date_range !== 'yesterday') {
        whereConditions.push(`(al.created_at AT TIME ZONE 'Asia/Manila') <= $${paramCount}`);
        values.push(endDate.toISOString());
        paramCount++;
      }
    }

    // Add WHERE clause if there are conditions
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, values);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM employee_activity_logs al
      LEFT JOIN employees e ON al.employee_id = e.id
    `;
    
    const countValues: any[] = [];
    let countParamCount = 1;
    const countWhereConditions: string[] = [];

    if (employee_id) {
      countWhereConditions.push(`al.employee_id = $${countParamCount}`);
      countValues.push(employee_id);
      countParamCount++;
    }

    if (action_type && action_type !== 'all') {
      countWhereConditions.push(`al.activity_type = $${countParamCount}`);
      countValues.push(action_type.toUpperCase());
      countParamCount++;
    }

    if (search) {
      countWhereConditions.push(`(
        al.activity_type ILIKE $${countParamCount} OR 
        al.description ILIKE $${countParamCount} OR 
        al.entity_type ILIKE $${countParamCount} OR 
        e.first_name ILIKE $${countParamCount} OR 
        e.last_name ILIKE $${countParamCount}
      )`);
      countValues.push(`%${search}%`);
      countParamCount++;
    }

    if (date_range && date_range !== 'all') {
      const now = new Date();
      let startDate: Date | undefined;
      let endDate: Date = new Date();

      switch (date_range) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'last_7_days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last_30_days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          if (start_date) {
            startDate = new Date(start_date);
          }
          if (end_date) {
            endDate = new Date(end_date + 'T23:59:59.999Z');
          }
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      if (startDate) {
        countWhereConditions.push(`al.created_at >= $${countParamCount}`);
        countValues.push(startDate.toISOString());
        countParamCount++;
      }

      if (date_range !== 'yesterday') {
        countWhereConditions.push(`al.created_at <= $${countParamCount}`);
        countValues.push(endDate.toISOString());
        countParamCount++;
      }
    }

    if (countWhereConditions.length > 0) {
      countQuery += ` WHERE ${countWhereConditions.join(' AND ')}`;
    }

    const countResult = await pool.query(countQuery, countValues);
    const totalCount = parseInt(countResult.rows[0].total);

    console.log(`✅ Retrieved ${result.rows.length} activity logs for employee ${employee_id}`);

    return NextResponse.json({
      success: true,
      logs: result.rows,
      count: result.rows.length,
      total_count: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
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
