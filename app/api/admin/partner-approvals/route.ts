import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { requireAdmin } from "@/backend/utils/requireAdmin";

// GET /api/admin/partner-approvals?status=pending|active|suspended|rejected|all
// Admin queue for partner approval — returns full onboarding data so the reviewer
// can see the documents, payout details, and business info in one view.
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const url = new URL(req.url);
    const status = (url.searchParams.get("status") || "pending").toLowerCase();

    const params: string[] = [];
    let whereClause = "";
    if (status !== "all") {
      params.push(status);
      whereClause = `WHERE pa.status = $1`;
    }

    const result = await pool.query(
      `SELECT
         pa.id::text,
         pa.partner_email,
         pa.status,
         pa.last_login,
         pa.created_at,
         pa.approved_at,
         pa.rejected_at,
         pa.rejection_reason,
         pa.suspended_at,
         pa.suspension_reason,
         pi.partner_fullname,
         pi.partner_phone,
         pi.business_name,
         pi.partner_address,
         pi.partner_city,
         pi.partner_province,
         pi.partner_postal_code,
         pi.valid_id_url,
         pi.valid_id_type,
         pi.contract_url,
         pi.contract_signed_at,
         pi.gcash_number,
         pi.gcash_holder_name,
         pi.maya_number,
         pi.maya_holder_name,
         pi.bank_name,
         pi.bank_account_name,
         pi.bank_account_number,
         pi.tax_id,
         pi.tax_registered_name,
         pi.docs_submitted_at,
         pi.profile_image_url,
         (
           SELECT COUNT(*)::int FROM havens WHERE partner_id = pa.id
         ) AS havens_count
       FROM partners_account pa
       LEFT JOIN partners_information pi ON pi.partner_id = pa.id
       ${whereClause}
       ORDER BY
         CASE pa.status
           WHEN 'pending' THEN 1
           WHEN 'active' THEN 2
           WHEN 'suspended' THEN 3
           WHEN 'rejected' THEN 4
           ELSE 5
         END,
         pa.created_at DESC
       LIMIT 200`,
      params
    );

    const counts = await pool.query(
      `SELECT status, COUNT(*)::int AS count FROM partners_account GROUP BY status`
    );
    const countMap: Record<string, number> = {};
    counts.rows.forEach((r: { status: string; count: number }) => {
      countMap[r.status] = r.count;
    });

    return NextResponse.json({ success: true, data: result.rows, counts: countMap });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "42P01") {
      return NextResponse.json({ success: true, data: [], counts: {} });
    }
    const msg = err instanceof Error ? err.message : "Failed to load partner approvals";
    console.error("[admin/partner-approvals GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
