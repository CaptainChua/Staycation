import { NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

// GET /api/partners/me/platform-documents
// Read-only list of platform-wide documents that the Owner has published.
// Partners cannot upload or delete; that's owner-only.
export async function GET() {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const result = await pool.query(
      `SELECT id, slot_key, label, description, file_url, mime_type, file_size_bytes, uploaded_at
         FROM platform_documents
        ORDER BY uploaded_at DESC`
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load platform documents";
    console.error("[partners/me/platform-documents GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
