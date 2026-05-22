import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/backend/config/db";
import { upload_file, delete_file } from "@/backend/utils/cloudinary";

const isOwner = async () => {
  const session = await getServerSession(authOptions);
  return ((session?.user as { role?: string } | undefined)?.role) === "Owner";
};

// GET — visible to anyone with an authenticated owner session (the
// partner-side read uses a separate endpoint that doesn't require Owner role).
export async function GET() {
  try {
    if (!(await isOwner())) {
      return NextResponse.json({ success: false, error: "Owner only" }, { status: 403 });
    }
    const result = await pool.query(
      `SELECT id, slot_key, label, description, file_url, cloudinary_public_id,
              mime_type, file_size_bytes, uploaded_at
         FROM platform_documents
        ORDER BY uploaded_at DESC`
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load documents";
    console.error("[admin/platform-documents GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST — owner uploads a platform document. When `slot_key` is provided the
// upload replaces whatever's currently in that slot (one file per slot). When
// it's null, a new row is inserted (ad-hoc upload, used elsewhere).
//
// Body: { label, description?, file_data_url, mime_type?, file_size_bytes?, slot_key? }
export async function POST(req: NextRequest) {
  try {
    if (!(await isOwner())) {
      return NextResponse.json({ success: false, error: "Owner only" }, { status: 403 });
    }
    const body = await req.json();
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : null;
    const fileDataUrl = typeof body?.file_data_url === "string" ? body.file_data_url : "";
    const mimeType = typeof body?.mime_type === "string" ? body.mime_type : null;
    const fileSizeBytes =
      typeof body?.file_size_bytes === "number" && Number.isFinite(body.file_size_bytes)
        ? Math.round(body.file_size_bytes)
        : null;
    const slotKey = typeof body?.slot_key === "string" && body.slot_key.trim() ? body.slot_key.trim() : null;

    if (!label) {
      return NextResponse.json({ success: false, error: "Label is required" }, { status: 400 });
    }
    if (!fileDataUrl || !fileDataUrl.startsWith("data:")) {
      return NextResponse.json(
        { success: false, error: "Valid data URL is required" },
        { status: 400 }
      );
    }

    // If this slot is already occupied, clean up the existing Cloudinary file
    // and remove the row so the unique constraint won't trip the new insert.
    if (slotKey) {
      const existing = await pool.query<{ id: string; cloudinary_public_id: string | null }>(
        `SELECT id, cloudinary_public_id FROM platform_documents WHERE slot_key = $1`,
        [slotKey]
      );
      if (existing.rows.length > 0) {
        const old = existing.rows[0];
        if (old.cloudinary_public_id) {
          try {
            await delete_file(old.cloudinary_public_id);
          } catch (cloudErr) {
            console.warn(
              "[admin/platform-documents POST] cleanup of previous slot file failed:",
              cloudErr instanceof Error ? cloudErr.message : cloudErr
            );
          }
        }
        await pool.query(`DELETE FROM platform_documents WHERE id = $1`, [old.id]);
      }
    }

    const uploaded = await upload_file(fileDataUrl, `platform-documents`);
    const result = await pool.query(
      `INSERT INTO platform_documents (
         slot_key, label, description, file_url, cloudinary_public_id,
         mime_type, file_size_bytes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, slot_key, label, description, file_url, cloudinary_public_id,
                 mime_type, file_size_bytes, uploaded_at`,
      [slotKey, label, description, uploaded.url, uploaded.public_id, mimeType, fileSizeBytes]
    );
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to upload document";
    console.error("[admin/platform-documents POST] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
