import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";
import { upload_file } from "@/backend/utils/cloudinary";

interface MediaItem {
  url: string;
  type: "image" | "video" | "screenshot";
  public_id?: string;
  uploaded_at: string;
}

// PATCH /api/partners/me/amenity-verifications/[id]
// Partner can:
//   - upload new media (base64 strings → Cloudinary)
//   - delete existing media (by url)
//   - update partner notes
// After ANY edit, status resets to 'pending' so admin re-reviews.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const newMediaBase64: Array<{ data: string; type?: "image" | "video" | "screenshot" }> =
      Array.isArray(body.new_media) ? body.new_media : [];
    const removeUrls: string[] = Array.isArray(body.remove_urls) ? body.remove_urls : [];
    const notes: string | undefined = typeof body.notes === "string" ? body.notes : undefined;

    // Ownership check: this verification belongs to a haven owned by this partner
    const ownerCheck = await pool.query(
      `SELECT av.id, av.media, av.status, av.haven_id, h.partner_id
       FROM haven_amenity_verifications av
       JOIN havens h ON h.uuid_id = av.haven_id
       WHERE av.id = $1`,
      [id]
    );
    if (ownerCheck.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const row = ownerCheck.rows[0];
    if (row.partner_id !== partnerId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Start from existing media, remove any caller asked to remove
    const currentMedia: MediaItem[] = Array.isArray(row.media) ? row.media : [];
    let media: MediaItem[] = currentMedia.filter((m) => !removeUrls.includes(m.url));

    // Upload new media to Cloudinary
    for (const item of newMediaBase64) {
      if (!item?.data) continue;
      try {
        const folder = `staycation-haven/amenity-verifications/${row.haven_id}`;
        const uploaded = await upload_file(item.data, folder);
        media.push({
          url: uploaded.url,
          type: item.type || (item.data.startsWith("data:video") ? "video" : "image"),
          public_id: uploaded.public_id,
          uploaded_at: new Date().toISOString(),
        });
      } catch (uploadErr) {
        console.error("[amenity-verifications PATCH] upload failed:", uploadErr);
        return NextResponse.json(
          { success: false, error: "Failed to upload media. Please try again." },
          { status: 500 }
        );
      }
    }

    // Any partner change resets review state to pending (forces re-review)
    const nextStatus = "pending";

    const result = await pool.query(
      `UPDATE haven_amenity_verifications
         SET media = $1::jsonb,
             notes = COALESCE($2, notes),
             status = $3,
             rejection_reason = NULL,
             reviewer_notes = NULL,
             reviewed_at = NULL,
             reviewed_by = NULL,
             updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [JSON.stringify(media), notes ?? null, nextStatus, id]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update verification";
    console.error("[partners/me/amenity-verifications/[id] PATCH] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
