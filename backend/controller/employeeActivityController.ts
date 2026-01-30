import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";

export interface EmployeeActivityLog {
  id?: string;
  employee_id: string;
  activity_type: string;
  description: string;
  entity_type?: string | null;
  entity_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string | null;
}

/**
 * CREATE Employee Activity Log
 *
 * Expected JSON body:
 * {
 *   employee_id: string (UUID),
 *   activity_type: string,
 *   description: string,
 *   entity_type?: string,
 *   entity_id?: string
 * }
 */
export const createEmployeeActivityLog = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { employee_id, activity_type, description, entity_type, entity_id } =
      body || {};

    if (!employee_id || !activity_type || !description) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: employee_id, activity_type, description",
        },
        { status: 400 },
      );
    }

    // Attempt to capture client metadata when possible
    const headers = req.headers;
    const ipAddress =
      headers.get("x-forwarded-for") ||
      headers.get("x-real-ip") ||
      headers.get("cf-connecting-ip") ||
      null;
    const userAgent = headers.get("user-agent") || null;

    const query = `
      INSERT INTO employee_activity_logs
        (employee_id, activity_type, description, entity_type, entity_id, ip_address, user_agent, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
      RETURNING *
    `;

    const values = [
      employee_id,
      activity_type,
      description,
      entity_type ?? null,
      entity_id ?? null,
      ipAddress,
      userAgent,
    ];

    const result = await pool.query(query, values);

    console.log("✅ Employee activity log created:", result.rows[0]);

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        message: "Employee activity log created successfully",
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("❌ Error creating employee activity log:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: errMsg || "Failed to create employee activity log",
      },
      { status: 500 },
    );
  }
};
