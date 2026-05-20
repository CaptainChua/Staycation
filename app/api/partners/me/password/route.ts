import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

// POST /api/partners/me/password — change password
// Body: { current_password, new_password }
export async function POST(req: NextRequest) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { current_password, new_password } = await req.json();

    if (!current_password || !new_password) {
      return NextResponse.json(
        { success: false, error: "Current and new password are required" },
        { status: 400 }
      );
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Fetch current password hash
    const partnerResult = await pool.query(
      `SELECT partner_password FROM partners_account WHERE id = $1`,
      [partnerId]
    );

    if (partnerResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Partner not found" }, { status: 404 });
    }

    const currentHash = partnerResult.rows[0].partner_password;
    const isValid = await bcrypt.compare(current_password, currentHash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash and save new password
    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query(
      `UPDATE partners_account
       SET partner_password = $2, updated_at = NOW()
       WHERE id = $1`,
      [partnerId, newHash]
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to change password";
    console.error("[partners/me/password POST] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
