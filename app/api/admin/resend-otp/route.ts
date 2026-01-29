import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, type } = body;

    if (!email || !type) {
      return NextResponse.json({
        success: false,
        error: "Email and type are required",
      }, { status: 400 });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Mark previous OTPs as used
    await pool.query(
      `UPDATE otp_verification SET is_used = true WHERE email = $1 AND otp_type = $2 AND is_used = false`,
      [email, type]
    );

    // Insert new OTP
    await pool.query(
      `INSERT INTO otp_verification (email, otp_code, otp_type, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [email, otp, type, expiresAt]
    );

    // TODO: Send email with OTP
    console.log(`📧 New OTP sent to ${email}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error: any) {
    console.error("❌ Error resending OTP:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to resend OTP",
    }, { status: 500 });
  }
}
