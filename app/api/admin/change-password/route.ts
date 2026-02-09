import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, currentPassword, newPassword } = await request.json();

    // Validation
    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Get user from database
    const query = `SELECT id, password FROM employees WHERE email = $1 LIMIT 1`;
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    const updateQuery = `UPDATE employees SET password = $1, updated_at = NOW() WHERE id = $2 RETURNING id`;
    await pool.query(updateQuery, [hashedNewPassword, user.id]);

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error: any) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { success: false, error: "Failed to change password" },
      { status: 500 }
    );
  }
}
