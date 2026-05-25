import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { upload_file } from "@/backend/utils/cloudinary";
import { requireEmployee } from "@/backend/utils/requireAdmin";

export async function GET(req: NextRequest) {
  const guard = await requireEmployee();
  if (!guard.ok) return guard.response;
  const checklistId = req.nextUrl.searchParams.get("checklist_id");
  if (!checklistId) {
    return NextResponse.json({ success: false, error: "checklist_id is required" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `SELECT category, image_url FROM cleaning_checklist_photos WHERE checklist_id = $1`,
      [checklistId],
    );

    const data: Record<string, string> = {};
    for (const row of result.rows) {
      data[row.category] = row.image_url;
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireEmployee();
  if (!guard.ok) return guard.response;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const checklistId = formData.get("checklist_id") as string | null;
    const category = formData.get("category") as string | null;

    if (!file || !checklistId || !category) {
      return NextResponse.json(
        { success: false, error: "file, checklist_id, and category are required" },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Only image files are allowed" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const uploadResult = await upload_file(
      dataUrl,
      "staycation-haven/cleaning-checklist-photos",
    );

    await pool.query(
      `INSERT INTO cleaning_checklist_photos (checklist_id, category, image_url, cloudinary_public_id, uploaded_at)
       VALUES ($1, $2, $3, $4, timezone('Asia/Manila', NOW()))
       ON CONFLICT (checklist_id, category)
       DO UPDATE SET
         image_url = EXCLUDED.image_url,
         cloudinary_public_id = EXCLUDED.cloudinary_public_id,
         uploaded_at = timezone('Asia/Manila', NOW())`,
      [checklistId, category, uploadResult.url, uploadResult.public_id],
    );

    return NextResponse.json({ success: true, url: uploadResult.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/admin/cleaners/checklist-photos error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
