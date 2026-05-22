import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/backend/config/db";
import { delete_file } from "@/backend/utils/cloudinary";

// DELETE /api/admin/platform-documents/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (((session?.user as { role?: string } | undefined)?.role) !== "Owner") {
      return NextResponse.json({ success: false, error: "Owner only" }, { status: 403 });
    }
    const { id } = await params;
    const existing = await pool.query<{ cloudinary_public_id: string | null }>(
      `SELECT cloudinary_public_id FROM platform_documents WHERE id = $1`,
      [id]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    if (existing.rows[0].cloudinary_public_id) {
      try {
        await delete_file(existing.rows[0].cloudinary_public_id);
      } catch (cloudErr) {
        console.warn(
          "[admin/platform-documents DELETE] cloudinary cleanup failed:",
          cloudErr instanceof Error ? cloudErr.message : cloudErr
        );
      }
    }
    await pool.query(`DELETE FROM platform_documents WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete document";
    console.error("[admin/platform-documents DELETE] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
