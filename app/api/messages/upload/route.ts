import { NextRequest, NextResponse } from "next/server";
import { upload_file } from "@/backend/utils/cloudinary";
import { requireEmployee } from "@/backend/utils/requireAdmin";

// Max upload sizes (bytes). Images are small; video is capped to keep
// uploads/playback reasonable for cleaners on mobile data.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const guard = await requireEmployee();
  if (!guard.ok) return guard.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "file is required" },
        { status: 400 },
      );
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      return NextResponse.json(
        { success: false, error: "Only image and video files are allowed" },
        { status: 400 },
      );
    }

    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      const mb = Math.round(maxBytes / (1024 * 1024));
      return NextResponse.json(
        { success: false, error: `${isVideo ? "Video" : "Image"} must be smaller than ${mb} MB.` },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const uploadResult = await upload_file(dataUrl, "staycation-haven/message-media");

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      type: isVideo ? "video" : "image",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/messages/upload error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
