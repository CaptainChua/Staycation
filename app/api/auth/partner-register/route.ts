import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/backend/config/db";

// POST /api/auth/partner-register
// Body:
//   email, password,
//   fullname, phone,
//   business_name?,
//   address?, city?, province?, postal_code?
//
// Creates a partners_account row (status='pending') + partners_information row.
// Partner can immediately log in but cannot list properties until status='active'.
export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullname = String(body.fullname || "").trim();
    const phone = String(body.phone || "").trim();

    if (!email || !password || !fullname) {
      return NextResponse.json(
        { success: false, error: "Email, password, and full name are required" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Uniqueness check
    const existing = await client.query(
      `SELECT 1 FROM partners_account WHERE partner_email = $1 LIMIT 1`,
      [email]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    await client.query("BEGIN");

    const hash = await bcrypt.hash(password, 10);
    const accountResult = await client.query(
      `INSERT INTO partners_account (partner_email, partner_password, status)
       VALUES ($1, $2, 'pending')
       RETURNING id::text, partner_email, status, created_at`,
      [email, hash]
    );
    const account = accountResult.rows[0];

    await client.query(
      `INSERT INTO partners_information
         (partner_id, partner_fullname, partner_phone,
          business_name,
          partner_address, partner_city, partner_province, partner_postal_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        account.id,
        fullname,
        phone || null,
        body.business_name ? String(body.business_name).trim() : null,
        body.address ? String(body.address).trim() : null,
        body.city ? String(body.city).trim() : null,
        body.province ? String(body.province).trim() : null,
        body.postal_code ? String(body.postal_code).trim() : null,
      ]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      data: {
        partner_id: account.id,
        email: account.partner_email,
        status: account.status,
        message:
          "Account created. You can log in now, but you'll need to upload your ID and contract before listing properties.",
      },
    });
  } catch (err: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    const msg = err instanceof Error ? err.message : "Registration failed";
    console.error("[auth/partner-register POST] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}
