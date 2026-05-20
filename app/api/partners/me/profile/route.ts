import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

// GET /api/partners/me/profile — fetch the logged-in partner's full profile
export async function GET() {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT
         pa.id,
         pa.partner_email AS email,
         pa.status,
         pa.last_login,
         pa.created_at AS joined_at,
         pi.partner_fullname AS fullname,
         pi.partner_phone AS phone,
         pi.partner_address AS address,
         pi.partner_city AS city,
         pi.partner_province AS province,
         pi.partner_postal_code AS postal_code,
         pi.partner_type AS type,
         pi.commission_rate,
         pi.total_earnings,
         pi.total_paid,
         pi.profile_image_url,
         pi.availability_status
       FROM partners_account pa
       LEFT JOIN partners_information pi ON pi.partner_id = pa.id
       WHERE pa.id = $1`,
      [partnerId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load profile";
    console.error("[partners/me/profile GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PATCH /api/partners/me/profile — update profile fields
export async function PATCH(req: NextRequest) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fullname, phone, address, city, province, postal_code, profile_image_url } = body;

    // Update partners_information (upsert in case row doesn't exist)
    await pool.query(
      `INSERT INTO partners_information
         (partner_id, partner_fullname, partner_phone, partner_address, partner_city,
          partner_province, partner_postal_code, profile_image_url)
       VALUES ($1, COALESCE($2, ''), $3, $4, $5, $6, $7, $8)
       ON CONFLICT (partner_id) DO UPDATE SET
         partner_fullname = COALESCE($2, partners_information.partner_fullname),
         partner_phone = COALESCE($3, partners_information.partner_phone),
         partner_address = COALESCE($4, partners_information.partner_address),
         partner_city = COALESCE($5, partners_information.partner_city),
         partner_province = COALESCE($6, partners_information.partner_province),
         partner_postal_code = COALESCE($7, partners_information.partner_postal_code),
         profile_image_url = COALESCE($8, partners_information.profile_image_url),
         updated_at = NOW()`,
      [
        partnerId,
        fullname ?? null,
        phone ?? null,
        address ?? null,
        city ?? null,
        province ?? null,
        postal_code ?? null,
        profile_image_url ?? null,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update profile";
    console.error("[partners/me/profile PATCH] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
