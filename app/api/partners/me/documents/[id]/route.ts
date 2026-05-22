import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";
import { delete_file } from "@/backend/utils/cloudinary";

// DELETE /api/partners/me/documents/:id
// Partner deletes one of their own documents.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const existing = await pool.query<{ cloudinary_public_id: string | null }>(
      `SELECT cloudinary_public_id
         FROM partner_documents
        WHERE id = $1 AND partner_id = $2`,
      [id, partnerId]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    if (existing.rows[0].cloudinary_public_id) {
      try {
        await delete_file(existing.rows[0].cloudinary_public_id);
      } catch (cloudErr) {
        // Don't block DB deletion on Cloudinary cleanup failures.
        console.warn(
          "[partners/me/documents DELETE] cloudinary cleanup failed:",
          cloudErr instanceof Error ? cloudErr.message : cloudErr
        );
      }
    }
    await pool.query(
      `DELETE FROM partner_documents WHERE id = $1 AND partner_id = $2`,
      [id, partnerId]
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete document";
    console.error("[partners/me/documents/:id DELETE] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
