import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";

export interface AdminUser {
  user_id: string;
  google_id?: string;
  facebook_id?: string;
  email: string;
  password?: string;
  user_role: string;
  name?: string;
  picture?: string;
  created_at: string;
  updated_at: string;
  last_login: string;
  register_as?: string;
}

// Get all users with optional filtering
export async function getAllAdminUsers(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    let query = `
      SELECT user_id, google_id, facebook_id, email, user_role, name, picture,
             created_at, updated_at, last_login, register_as
      FROM users
    `;

    const conditions: string[] = [];
    const values: string[] = [];
    let paramCount = 1;

    if (role && role !== "all") {
      conditions.push(`user_role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (search) {
      conditions.push(`(name ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error: unknown) {
    console.error("Error getting users:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get users";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Get user by ID
export async function getAdminUserById(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const params = await ctx.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const query = `
      SELECT user_id, google_id, facebook_id, email, user_role, name, picture,
             created_at, updated_at, last_login, register_as
      FROM users
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: unknown) {
    console.error("Error getting user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get user";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Update user
export async function updateAdminUser(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { user_id, name, email, user_role } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const query = `
      UPDATE users
      SET name = COALESCE($2, name),
          email = COALESCE($3, email),
          user_role = COALESCE($4, user_role),
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING user_id, google_id, facebook_id, email, user_role, name, picture,
                created_at, updated_at, last_login, register_as
    `;

    const result = await pool.query(query, [user_id, name, email, user_role]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    console.log("User updated:", result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "User updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Delete user
export async function deleteAdminUser(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const query = `DELETE FROM users WHERE user_id = $1 RETURNING user_id, email, name`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    console.log("User deleted:", result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "User deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
