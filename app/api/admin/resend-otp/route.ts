import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { sendOtpEmail } from "@/backend/utils/sendOtpEmail";

// PUBLIC BY DESIGN — called by an UNAUTHENTICATED locked-out user from the
// OtpVerification UI to request a fresh unlock code. Must NOT call
// requireAdmin(). See backend/utils/requireAdmin.ts for the exemption list.
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

    // Get user info for email template — check employees first, then partners.
    let userName = null;
    if (type === 'ACCOUNT_LOCK') {
      try {
        const userResult = await pool.query(
          "SELECT first_name, last_name FROM employees WHERE email = $1",
          [email]
        );
        if (userResult.rows.length > 0) {
          userName = `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`;
        } else {
          const partnerResult = await pool.query(
            `SELECT pi.partner_fullname
             FROM partners_account pa
             LEFT JOIN partners_information pi ON pi.partner_id = pa.id
             WHERE pa.partner_email = $1`,
            [email]
          );
          if (partnerResult.rows.length > 0) {
            userName = partnerResult.rows[0].partner_fullname || null;
          }
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
        // Continue without user name
      }
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

    // Send email with OTP — direct call (no HTTP hop) so send-email can be
    // locked down later without breaking the unlock flow.
    try {
      await sendOtpEmail({ email, otp, type, userName });
    } catch (emailError) {
      console.error("❌ Failed to send OTP email:", emailError);
      // Continue — the OTP row is already inserted; user can retry resend.
    }

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
