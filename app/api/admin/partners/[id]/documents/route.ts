import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/backend/config/db";
import { upload_file } from "@/backend/utils/cloudinary";

const requireOwner = async () => {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "Owner";
};

// GET /api/admin/partners/:id/documents
// Owner view of a single partner's documents (both partner- and owner-uploaded).
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
      `SELECT id, partner_id, label, file_url, cloudinary_public_id,
              mime_type, file_size_bytes, uploaded_by, uploaded_at
         FROM partner_documents
        WHERE partner_id = $1
        ORDER BY uploaded_at DESC`,
      [id]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load documents";
    console.error("[admin/partners/:id/documents GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/admin/partners/:id/documents
// Owner uploads a labeled document for a partner.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireOwner())) {
      return NextResponse.json({ success: false, error: "Owner only" }, { status: 403 });
    }
    const { id: partnerId } = await params;
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

    const uploaded = await upload_file(fileDataUrl, `partner-documents/${partnerId}`);
    const result = await pool.query(
      `INSERT INTO partner_documents (
         partner_id, label, file_url, cloudinary_public_id,
         mime_type, file_size_bytes, uploaded_by
       ) VALUES ($1, $2, $3, $4, $5, $6, 'owner')
       RETURNING id, partner_id, label, file_url, cloudinary_public_id,
                 mime_type, file_size_bytes, uploaded_by, uploaded_at`,
      [partnerId, label, uploaded.url, uploaded.public_id, mimeType, fileSizeBytes]
    );
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to upload document";
    console.error("[admin/partners/:id/documents POST] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
