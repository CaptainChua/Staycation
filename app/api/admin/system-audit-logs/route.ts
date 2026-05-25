import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { requireAdmin } from "@/backend/utils/requireAdmin";

// GET /api/admin/system-audit-logs
//   ?entity_type=&entity_id=&actor_email=&action=&limit=&offset=
// Returns system-wide audit-log rows from the `audit_logs` table (separate from
// the older `employee_activity_logs` which covers admin login/staff actions).
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const url = new URL(req.url);
    const entityType = url.searchParams.get("entity_type");
    const entityId = url.searchParams.get("entity_id");
    const actorEmail = url.searchParams.get("actor_email");
    const action = url.searchParams.get("action");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const params: (string | number)[] = [];
    const where: string[] = [];

    if (entityType) { params.push(entityType); where.push(`entity_type = $${params.length}`); }
    if (entityId)   { params.push(entityId);   where.push(`entity_id = $${params.length}`); }
    if (actorEmail) { params.push(`%${actorEmail}%`); where.push(`actor_email ILIKE $${params.length}`); }
    if (action)     { params.push(`%${action}%`); where.push(`action ILIKE $${params.length}`); }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    params.push(limit, offset);

    const result = await pool.query(
      `SELECT id, action, entity_type, entity_id, actor_type, actor_id, actor_email,
              metadata, ip_address, created_at
       FROM audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // Per-entity_type counts for the filter UI
    const breakdown = await pool.query(
      `SELECT entity_type, COUNT(*)::int AS count
       FROM audit_logs
       GROUP BY entity_type
       ORDER BY count DESC`
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      counts: breakdown.rows,
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "42P01") {
      return NextResponse.json({ success: true, data: [], counts: [] });
    }
    const msg = err instanceof Error ? err.message : "Failed to load audit logs";
    console.error("[admin/system-audit-logs GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
