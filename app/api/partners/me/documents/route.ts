import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";
import { upload_file } from "@/backend/utils/cloudinary";

// GET /api/partners/me/documents
// Lists the partner's own documents (owner-uploaded ones included).
export async function GET() {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const result = await pool.query(
      `SELECT id, label, file_url, cloudinary_public_id, mime_type, file_size_bytes,
              uploaded_by, uploaded_at
         FROM partner_documents
        WHERE partner_id = $1
        ORDER BY uploaded_at DESC`,
      [partnerId]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load documents";
    console.error("[partners/me/documents GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/partners/me/documents
// Body: { label: string, file_data_url: string, mime_type?: string, file_size_bytes?: number }
// Partner uploads a single labeled document. File is sent as a data URL and
// uploaded to Cloudinary on the server.
export async function POST(req: NextRequest) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    const fileDataUrl = typeof body?.file_data_url === "string" ? body.file_data_url : "";
    const mimeType = typeof body?.mime_type === "string" ? body.mime_type : null;
    const fileSizeBytes =
      typeof body?.file_size_bytes === "number" && Number.isFinite(body.file_size_bytes)
        ? Math.round(body.file_size_bytes)
        : null;

    if (!label) {
      return NextResponse.json(
        { success: false, error: "Label is required" },
        { status: 400 }
      );
    }
    if (!fileDataUrl || !fileDataUrl.startsWith("data:")) {
      return NextResponse.json(
        { success: false, error: "Valid data URL is required" },
        { status: 400 }
      );
    }

    const uploaded = await upload_file(fileDataUrl, `partner-documents/${partnerId}`);
    const result = await pool.query(
      `INSERT INTO partner_documents (
         partner_id, label, file_url, cloudinary_public_id,
         mime_type, file_size_bytes, uploaded_by
       ) VALUES ($1, $2, $3, $4, $5, $6, 'partner')
       RETURNING id, label, file_url, cloudinary_public_id, mime_type, file_size_bytes,
                 uploaded_by, uploaded_at`,
      [partnerId, label, uploaded.url, uploaded.public_id, mimeType, fileSizeBytes]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to upload document";
    console.error("[partners/me/documents POST] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
