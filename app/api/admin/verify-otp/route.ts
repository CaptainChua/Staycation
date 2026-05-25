import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";

// PUBLIC BY DESIGN — called by an UNAUTHENTICATED locked-out user
// (employee or partner) to unlock their account via OTP. Must NOT call
// requireAdmin(). See backend/utils/requireAdmin.ts for the exemption list.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, type } = body;

    if (!email || !otp || !type) {
      return NextResponse.json(
        { success: false, error: "Email, OTP, and type are required" },
        { status: 400 }
      );
    }

    // 🔍 Find latest unused OTP
    const query = `
      SELECT id, email, otp_code, otp_type, expires_at, is_used, attempts
      FROM otp_verification
      WHERE email = $1
        AND otp_code = $2
        AND otp_type = $3
        AND is_used = false
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [email, otp, type]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    const otpRecord = result.rows[0];

    // ⏱ Check expiration
    if (new Date() > new Date(otpRecord.expires_at)) {
      return NextResponse.json(
        { success: false, error: "OTP has expired" },
        { status: 400 }
      );
    }

    // 🚫 Too many OTP attempts
    if (otpRecord.attempts >= 3) {
      await pool.query(
        `UPDATE otp_verification SET is_used = true WHERE id = $1`,
        [otpRecord.id]
      );

      return NextResponse.json(
        {
          success: false,
          error: "Maximum OTP attempts exceeded. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    // ✅ OTP IS VALID → MARK USED
    await pool.query(
      `UPDATE otp_verification
       SET is_used = true
       WHERE id = $1`,
      [otpRecord.id]
    );

    // 🔓 UNLOCK ACCOUNT (CRITICAL)
    // The OTP is keyed only by email, so we don't know which table the locked
    // account lives in. Reset login_attempts on both — only the matching row
    // will actually change.
    if (type === "ACCOUNT_LOCK") {
      await pool.query(
        `UPDATE employees
         SET login_attempts = 0,
             updated_at = NOW()
         WHERE email = $1`,
        [email]
      );
      await pool.query(
        `UPDATE partners_account
         SET login_attempts = 0,
             updated_at = NOW()
         WHERE partner_email = $1`,
        [email]
      );
    }

    console.log(`✅ OTP verified & account unlocked for ${email}`);

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
    });
    
  } catch (error: any) {
    console.error("❌ Error verifying OTP:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to verify OTP",
      },
      { status: 500 }
    );
  }
}
