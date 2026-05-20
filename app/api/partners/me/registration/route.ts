import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { upload_file } from "@/backend/utils/cloudinary";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

// GET /api/partners/me/registration
// Returns the partner's current registration state — status, rejection reason,
// which documents are uploaded, and what's still needed.
export async function GET() {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT
         pa.id::text,
         pa.partner_email,
         pa.status,
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
         pi.docs_submitted_at
       FROM partners_account pa
       LEFT JOIN partners_information pi ON pi.partner_id = pa.id
       WHERE pa.id = $1`,
      [partnerId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Partner not found" }, { status: 404 });
    }

    const row = result.rows[0];
    // Derive checklist so the UI can show progress meaningfully
    const checklist = {
      basic_info: !!(row.partner_fullname && row.partner_phone),
      address: !!(row.partner_address && row.partner_city),
      valid_id: !!row.valid_id_url,
      contract: !!row.contract_url,
      payout: !!(row.gcash_number || row.maya_number || row.bank_account_number),
    };
    const required: Array<keyof typeof checklist> = ["basic_info", "valid_id", "contract", "payout"];
    const missing = required.filter((k) => !checklist[k]);

    return NextResponse.json({
      success: true,
      data: {
        ...row,
        checklist,
        ready_for_review: missing.length === 0 && row.status === "pending",
        missing,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load registration";
    console.error("[partners/me/registration GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PATCH /api/partners/me/registration
// Update onboarding fields. Accepts any subset; only sends changed fields.
// File uploads:
//   - valid_id_data_url   (string, data URL) + valid_id_type (string)
//   - contract_data_url   (string, data URL)
// Uploaded files go to Cloudinary under staycation-haven/partner-docs/<partner_id>/.
//
// After EVERY update we recompute docs_submitted_at if the partner has uploaded
// both required documents AND filled the required payout/business info.
export async function PATCH(req: NextRequest) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const folder = `staycation-haven/partner-docs/${partnerId}`;

    // Upload new ID if a data URL was supplied
    let validIdUrl: string | null = null;
    let validIdPublicId: string | null = null;
    if (body.valid_id_data_url && typeof body.valid_id_data_url === "string") {
      try {
        const uploaded = await upload_file(body.valid_id_data_url, `${folder}/valid-id`);
        validIdUrl = uploaded.url;
        validIdPublicId = uploaded.public_id;
      } catch (uploadErr) {
        console.error("[registration PATCH] valid_id upload failed:", uploadErr);
        return NextResponse.json(
          { success: false, error: "Could not upload the ID image. Please try again." },
          { status: 500 }
        );
      }
    }

    // Upload new contract if supplied
    let contractUrl: string | null = null;
    let contractPublicId: string | null = null;
    if (body.contract_data_url && typeof body.contract_data_url === "string") {
      try {
        const uploaded = await upload_file(body.contract_data_url, `${folder}/contract`);
        contractUrl = uploaded.url;
        contractPublicId = uploaded.public_id;
      } catch (uploadErr) {
        console.error("[registration PATCH] contract upload failed:", uploadErr);
        return NextResponse.json(
          { success: false, error: "Could not upload the contract. Please try again." },
          { status: 500 }
        );
      }
    }

    // Upsert into partners_information using COALESCE so unchanged columns stay intact
    await pool.query(
      `INSERT INTO partners_information (partner_id, partner_fullname, business_name)
       VALUES ($1, COALESCE($2, ''), COALESCE($3, ''))
       ON CONFLICT (partner_id) DO UPDATE SET
         partner_fullname     = COALESCE($2, partners_information.partner_fullname),
         partner_phone        = COALESCE($4, partners_information.partner_phone),
         business_name        = COALESCE($3, partners_information.business_name),
         partner_address      = COALESCE($5, partners_information.partner_address),
         partner_city         = COALESCE($6, partners_information.partner_city),
         partner_province     = COALESCE($7, partners_information.partner_province),
         partner_postal_code  = COALESCE($8, partners_information.partner_postal_code),
         valid_id_url         = COALESCE($9, partners_information.valid_id_url),
         valid_id_public_id   = COALESCE($10, partners_information.valid_id_public_id),
         valid_id_type        = COALESCE($11, partners_information.valid_id_type),
         contract_url         = COALESCE($12, partners_information.contract_url),
         contract_public_id   = COALESCE($13, partners_information.contract_public_id),
         contract_signed_at   = CASE WHEN $12 IS NOT NULL THEN NOW() ELSE partners_information.contract_signed_at END,
         gcash_number         = COALESCE($14, partners_information.gcash_number),
         gcash_holder_name    = COALESCE($15, partners_information.gcash_holder_name),
         maya_number          = COALESCE($16, partners_information.maya_number),
         maya_holder_name     = COALESCE($17, partners_information.maya_holder_name),
         bank_name            = COALESCE($18, partners_information.bank_name),
         bank_account_name    = COALESCE($19, partners_information.bank_account_name),
         bank_account_number  = COALESCE($20, partners_information.bank_account_number),
         tax_id               = COALESCE($21, partners_information.tax_id),
         tax_registered_name  = COALESCE($22, partners_information.tax_registered_name),
         updated_at           = NOW()`,
      [
        partnerId,
        body.fullname ?? null,
        body.business_name ?? null,
        body.phone ?? null,
        body.address ?? null,
        body.city ?? null,
        body.province ?? null,
        body.postal_code ?? null,
        validIdUrl,
        validIdPublicId,
        body.valid_id_type ?? null,
        contractUrl,
        contractPublicId,
        body.gcash_number ?? null,
        body.gcash_holder_name ?? null,
        body.maya_number ?? null,
        body.maya_holder_name ?? null,
        body.bank_name ?? null,
        body.bank_account_name ?? null,
        body.bank_account_number ?? null,
        body.tax_id ?? null,
        body.tax_registered_name ?? null,
      ]
    );

    // Recompute docs_submitted_at — stamp it the first time everything is in
    await pool.query(
      `UPDATE partners_information
         SET docs_submitted_at = CASE
              WHEN docs_submitted_at IS NULL
                AND valid_id_url IS NOT NULL
                AND contract_url IS NOT NULL
                AND (gcash_number IS NOT NULL OR maya_number IS NOT NULL OR bank_account_number IS NOT NULL)
              THEN NOW()
              ELSE docs_submitted_at
            END,
            updated_at = NOW()
       WHERE partner_id = $1`,
      [partnerId]
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update registration";
    console.error("[partners/me/registration PATCH] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
