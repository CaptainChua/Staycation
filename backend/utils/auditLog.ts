import pool from "@/backend/config/db";

export type AuditActor = "admin" | "partner" | "cron" | "system" | "guest" | "csr";

export interface AuditEntry {
  action: string;
  entity_type: "haven" | "partner" | "payout" | "amenity_verification" | "booking" | "ical_feed";
  entity_id: string;
  actor_type: AuditActor;
  actor_id?: string | null;
  actor_email?: string | null;
  metadata?: Record<string, unknown>;
  ip_address?: string | null;
  user_agent?: string | null;
}

/**
 * Append-only logger. Failures are swallowed (audit logging must never block the
 * business action). Call after the write succeeds.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_logs
         (action, entity_type, entity_id, actor_type, actor_id, actor_email,
          metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,
      [
        entry.action,
        entry.entity_type,
        String(entry.entity_id),
        entry.actor_type,
        entry.actor_id || null,
        entry.actor_email || null,
        JSON.stringify(entry.metadata || {}),
        entry.ip_address || null,
        entry.user_agent || null,
      ]
    );
  } catch (err) {
    // Don't throw — audit logging must never break the actual flow
    const code = (err as { code?: string })?.code;
    if (code !== "42P01") {
      // Only complain in console if it's not "table missing" (migration not run)
      console.warn("[auditLog] failed:", err);
    }
  }
}
