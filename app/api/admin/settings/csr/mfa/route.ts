import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/backend/utils/requireAdmin";
import pool from "@/backend/config/db";

// Ensure the mfa_enabled column exists (self-healing if the migration wasn't run).
async function ensureMfaColumn() {
  await pool.query(
    "ALTER TABLE employees ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false",
  );
}

// GET — return the current employee's MFA status
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const email = guard.session.user.email;
  try {
    const result = await pool.query(
      "SELECT mfa_enabled FROM employees WHERE email = $1",
      [email],
    );
    const mfaEnabled = result.rows[0]?.mfa_enabled ?? false;
    return NextResponse.json({ mfaEnabled });
  } catch (error) {
    // Column likely missing (migration not run) — degrade gracefully so the
    // Settings page still loads. Toggling MFA on will create the column.
    console.error("MFA status check failed (treating as disabled):", error);
    return NextResponse.json({ mfaEnabled: false });
  }
}

// POST — enable/disable MFA for the current employee
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const email = guard.session.user.email;
  try {
    const body = await request.json();
    const enabled = Boolean(body?.enabled);

    // Make sure the column exists before we write to it.
    await ensureMfaColumn();

    const result = await pool.query(
      "UPDATE employees SET mfa_enabled = $1, updated_at = NOW() WHERE email = $2 RETURNING mfa_enabled",
      [enabled, email],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ mfaEnabled: result.rows[0].mfa_enabled });
  } catch (error) {
    console.error("Error updating MFA status:", error);
    return NextResponse.json({ error: "Failed to update MFA status" }, { status: 500 });
  }
}
