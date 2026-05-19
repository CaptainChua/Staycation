import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, extname } from "path";
import pool from "../config/db";

/**
 * Cleaning Photos Controller
 *
 * Endpoints handled:
 *
 *  GET  /api/admin/cleaners?haven_id=...
 *       Returns the active cleaning session + all photos grouped by category.
 *       Creates a new session automatically if none exists.
 *
 *  POST /api/admin/cleaners/photos          (multipart/form-data)
 *       Uploads a photo for one room category.
 *       Body fields: haven_id, category, photo (File), session_id? (optional)
 *
 *  POST /api/admin/cleaners/photos          (application/json)
 *       Submits (finalises) a cleaning session.
 *       Body: { action: "submit", session_id: string }
 *
 *  DELETE /api/admin/cleaners/photos?photo_id=...
 *       Removes a single photo record (and its file from disk).
 *
 * DB tables assumed:
 *
 *   cleaning_checklists (id, haven_id, status, completed_at, created_at, updated_at)
 *   — reused as the "cleaning session" tracker; no tasks column needed.
 *
 *   cleaning_photos (
 *     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     session_id  UUID REFERENCES cleaning_checklists(id) ON DELETE CASCADE,
 *     haven_id    UUID REFERENCES havens(uuid_id),
 *     category    VARCHAR(100) NOT NULL,
 *     photo_url   TEXT NOT NULL,
 *     file_name   TEXT,
 *     created_at  TIMESTAMPTZ DEFAULT timezone('Asia/Manila', NOW()),
 *     updated_at  TIMESTAMPTZ DEFAULT timezone('Asia/Manila', NOW())
 *   )
 *
 * File storage:
 *   Photos are written to  <project_root>/public/uploads/cleaning/<haven_id>/<category>/
 *   and served at           /uploads/cleaning/<haven_id>/<category>/<filename>
 *
 *   For production on serverless platforms (Vercel, etc.) swap saveFileToDisk()
 *   for a cloud-storage upload (S3, Cloudinary, Supabase Storage, etc.).
 */

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Saves an uploaded File to the local public/uploads directory. */
async function saveFileToDisk(
  file: File,
  havenId: string,
  category: string
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Sanitise category for use as a folder name
  const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, "_");

  const uploadDir = join(
    process.cwd(),
    "public",
    "uploads",
    "cleaning",
    havenId,
    safeCategory
  );

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const ext = extname(file.name) || ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filepath = join(uploadDir, filename);

  await writeFile(filepath, buffer);

  return `/uploads/cleaning/${havenId}/${safeCategory}/${filename}`;
}

/** Returns (or creates) an active cleaning session for the given haven. */
async function getOrCreateSession(havenId: string): Promise<string> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Serialise creation with an advisory lock
    await client.query(
      `SELECT pg_advisory_xact_lock(hashtext($1)::bigint)`,
      [havenId]
    );

    const existing = await client.query(
      `SELECT id FROM cleaning_checklists
       WHERE haven_id = $1 AND status != 'completed'
       ORDER BY created_at DESC LIMIT 1`,
      [havenId]
    );

    if (existing.rows.length > 0) {
      await client.query("COMMIT");
      return existing.rows[0].id as string;
    }

    const created = await client.query(
      `INSERT INTO cleaning_checklists (haven_id, status, created_at, updated_at)
       VALUES ($1, 'pending', timezone('Asia/Manila', NOW()), timezone('Asia/Manila', NOW()))
       RETURNING id`,
      [havenId]
    );

    await client.query("COMMIT");
    return created.rows[0].id as string;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/* ------------------------------------------------------------------ */
/*  GET — fetch session + photos for a haven                           */
/* ------------------------------------------------------------------ */

export const getPhotosByHaven = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const havenId = searchParams.get("haven_id");

    if (!havenId) {
      return NextResponse.json(
        { success: false, error: "haven_id is required" },
        { status: 400 }
      );
    }

    // Verify haven exists
    const havenCheck = await pool.query(
      `SELECT uuid_id FROM havens WHERE uuid_id = $1`,
      [havenId]
    );
    if (havenCheck.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: "Haven not found" },
        { status: 404 }
      );
    }

    // Get or create active session
    const sessionId = await getOrCreateSession(havenId);

    // Fetch session info
    const sessionRes = await pool.query(
      `SELECT id, haven_id, status, completed_at, created_at, updated_at
       FROM cleaning_checklists WHERE id = $1`,
      [sessionId]
    );

    // Fetch photos
    const photosRes = await pool.query(
      `SELECT id, session_id, haven_id, category, photo_url AS url, file_name, created_at
       FROM cleaning_photos
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );

    return NextResponse.json({
      success: true,
      data: {
        session: sessionRes.rows[0] ?? null,
        photos: photosRes.rows,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getPhotosByHaven error:", message);
    return NextResponse.json(
      { success: false, error: message || "Failed to load photos" },
      { status: 500 }
    );
  }
};

/* ------------------------------------------------------------------ */
/*  POST — upload a photo  (multipart/form-data)                       */
/*       — submit session  (application/json, action: "submit")        */
/* ------------------------------------------------------------------ */

export const handlePhotoPost = async (
  req: NextRequest
): Promise<NextResponse> => {
  const contentType = req.headers.get("content-type") ?? "";

  /* ---- Submit action ---- */
  if (contentType.includes("application/json")) {
    try {
      const body = await req.json();

      if (body?.action !== "submit") {
        return NextResponse.json(
          { success: false, error: "Unknown action" },
          { status: 400 }
        );
      }

      const { session_id } = body;
      if (!session_id) {
        return NextResponse.json(
          { success: false, error: "session_id is required" },
          { status: 400 }
        );
      }

      // Check at least one photo exists
      const photoCount = await pool.query(
        `SELECT COUNT(*)::int AS cnt FROM cleaning_photos WHERE session_id = $1`,
        [session_id]
      );
      if ((photoCount.rows[0]?.cnt ?? 0) === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot submit: no photos have been uploaded yet",
          },
          { status: 400 }
        );
      }

      const updated = await pool.query(
        `UPDATE cleaning_checklists
         SET status = 'completed',
             completed_at = timezone('Asia/Manila', NOW()),
             updated_at   = timezone('Asia/Manila', NOW())
         WHERE id = $1
         RETURNING id, haven_id, status, completed_at`,
        [session_id]
      );

      if (updated.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Session not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Cleaning submitted successfully",
        data: { session: updated.rows[0] },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("submitSession error:", message);
      return NextResponse.json(
        { success: false, error: message || "Failed to submit session" },
        { status: 500 }
      );
    }
  }

  /* ---- Photo upload (multipart) ---- */
  try {
    const formData = await req.formData();

    const havenId = formData.get("haven_id") as string | null;
    const category = formData.get("category") as string | null;
    const photoFile = formData.get("photo") as File | null;
    const providedSessionId = formData.get("session_id") as string | null;

    if (!havenId || !category || !photoFile) {
      return NextResponse.json(
        {
          success: false,
          error: "haven_id, category, and photo are required",
        },
        { status: 400 }
      );
    }

    if (!photoFile.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Only image files are accepted" },
        { status: 400 }
      );
    }

    // Resolve or create session
    const sessionId =
      providedSessionId ?? (await getOrCreateSession(havenId));

    // Save file to disk (swap for cloud storage in production)
    const photoUrl = await saveFileToDisk(photoFile, havenId, category);

    // Insert photo record
    const insertRes = await pool.query(
      `INSERT INTO cleaning_photos
         (session_id, haven_id, category, photo_url, file_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5,
               timezone('Asia/Manila', NOW()),
               timezone('Asia/Manila', NOW()))
       RETURNING id, session_id, haven_id, category, photo_url AS url, file_name, created_at`,
      [sessionId, havenId, category, photoUrl, photoFile.name]
    );

    // Bump session status to in_progress if still pending
    await pool.query(
      `UPDATE cleaning_checklists
       SET status = CASE WHEN status = 'pending' THEN 'in_progress' ELSE status END,
           updated_at = timezone('Asia/Manila', NOW())
       WHERE id = $1`,
      [sessionId]
    );

    return NextResponse.json({
      success: true,
      data: {
        photo: insertRes.rows[0],
        session_id: sessionId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("uploadPhoto error:", message);
    return NextResponse.json(
      { success: false, error: message || "Failed to upload photo" },
      { status: 500 }
    );
  }
};

/* ------------------------------------------------------------------ */
/*  DELETE — remove a photo                                            */
/* ------------------------------------------------------------------ */

export const deletePhoto = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get("photo_id");

    if (!photoId) {
      return NextResponse.json(
        { success: false, error: "photo_id is required" },
        { status: 400 }
      );
    }

    // Fetch the record first so we can delete the file from disk
    const photoRes = await pool.query(
      `SELECT id, photo_url FROM cleaning_photos WHERE id = $1`,
      [photoId]
    );

    if (photoRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Photo not found" },
        { status: 404 }
      );
    }

    await pool.query(`DELETE FROM cleaning_photos WHERE id = $1`, [photoId]);

    // Best-effort: delete the file from disk (non-fatal if it fails)
    try {
      const { unlink } = await import("fs/promises");
      const relativeUrl: string = photoRes.rows[0].photo_url;
      const absolutePath = join(process.cwd(), "public", relativeUrl);
      await unlink(absolutePath);
    } catch {
      // File may already be gone or on cloud storage — ignore
    }

    return NextResponse.json({
      success: true,
      message: "Photo deleted",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("deletePhoto error:", message);
    return NextResponse.json(
      { success: false, error: message || "Failed to delete photo" },
      { status: 500 }
    );
  }
};