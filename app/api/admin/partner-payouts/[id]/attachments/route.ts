import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/backend/config/db";
import { upload_file } from "@/backend/utils/cloudinary";

const requireOwner = async () => {
  const session = await getServerSession(authOptions);
  return ((session?.user as { role?: string } | undefined)?.role) === "Owner";
};

// GET /api/admin/partner-payouts/:id/attachments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireOwner())) {
      return NextResponse.json({ success: false, error: "Owner only" }, { status: 403 });
    }
    const { id } = await params;
    const result = await pool.query(
      `SELECT id, payout_id, label, file_url, cloudinary_public_id,
              mime_type, file_size_bytes, uploaded_at
         FROM partner_payout_attachments
        WHERE payout_id = $1
        ORDER BY uploaded_at DESC`,
      [id]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load attachments";
    console.error("[admin/partner-payouts/:id/attachments GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/admin/partner-payouts/:id/attachments
// Body: { label, file_data_url, mime_type?, file_size_bytes? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireOwner())) {
      return NextResponse.json({ success: false, error: "Owner only" }, { status: 403 });
    }
    const { id: payoutId } = await params;
    const body = await req.json();
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    const fileDataUrl = typeof body?.file_data_url === "string" ? body.file_data_url : "";
    const mimeType = typeof body?.mime_type === "string" ? body.mime_type : null;
    const fileSizeBytes =
      typeof body?.file_size_bytes === "number" && Number.isFinite(body.file_size_bytes)
        ? Math.round(body.file_size_bytes)
        : null;

    if (!label) {
      return NextResponse.json({ success: false, error: "Label is required" }, { status: 400 });
    }
    if (!fileDataUrl || !fileDataUrl.startsWith("data:")) {
      return NextResponse.json(
        { success: false, error: "Valid data URL is required" },
        { status: 400 }
      );
    }

    const uploaded = await upload_file(fileDataUrl, `payout-evidence/${payoutId}`);
    const result = await pool.query(
      `INSERT INTO partner_payout_attachments (
         payout_id, label, file_url, cloudinary_public_id,
         mime_type, file_size_bytes
       ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, payout_id, label, file_url, cloudinary_public_id,
                 mime_type, file_size_bytes, uploaded_at`,
      [payoutId, label, uploaded.url, uploaded.public_id, mimeType, fileSizeBytes]
    );
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to upload attachment";
    console.error("[admin/partner-payouts/:id/attachments POST] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
