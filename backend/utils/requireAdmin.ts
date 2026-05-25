// Guard for /api/admin/** routes. Returns either a NextResponse (401/403) that
// the route should return immediately, or the session for the authorized user.
//
// Usage:
//   const guard = await requireAdmin();
//   if (!guard.ok) return guard.response;
//   const session = guard.session;
//
// NOT YET APPLIED. Will be rolled out route-by-route in a follow-up commit
// after auth.ts + resend-otp were detangled from the /api/admin/send-email
// HTTP hop (so locking down send-email no longer breaks the lockout flow).
//
// Explicitly OUT of scope for this guard — these routes are public by design
// and must NOT call requireAdmin():
//   - /api/admin/login           (it IS the login endpoint)
//   - /api/admin/send-email      (called by unauthenticated OtpVerification UI)
//   - /api/admin/resend-otp      (called by locked-out user)
//   - /api/admin/verify-otp      (called by locked-out user)
//   - /api/admin/change-password (authenticates via old password in body)
//   - /api/admin/haven/[id]/times (called from public Checkout.tsx for guests)
//   - /api/payment-methods GET   (called from public Checkout.tsx for guests)
//
// Routes with a CONDITIONAL public branch (read the route file for the carve-out):
//   - /api/admin/employees GET with ?role=CSR → minimal public projection
//     for Components/MessageButton.tsx (chat widget on the public marketplace).
//     All other GET shapes + POST are admin-only.
//   - /api/admin/blocked-dates GET with ?haven_id=<uuid> → minimal projection
//     (id, from_date, to_date, status) for Components/HeroSection/DateRangePicker
//     (guest checkout). No haven_id → admin-only management view.
//   - /api/admin/sync-sheets POST → valid CRON bearer OR admin session.
//
// Routes that use requireEmployee() instead (Owner+CSR+Cleaner):
//   - /api/admin/cleaners/**         (cleaner dashboards)
//   - /api/admin/employees/[id] GET, PUT (any role's own profile page)
//   - /api/admin/activity-logs POST  (self-logging from any role)
//   - /api/admin/employee-activity POST (same)

import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const ADMIN_ROLES = new Set(["Owner", "CSR"]);
const EMPLOYEE_ROLES = new Set(["Owner", "CSR", "Cleaner"]);

// On ok=true, session.user is guaranteed non-null (the guard rejects sessions
// without a user). Callers can read session.user.email directly — no `!` needed.
export type AuthedSession = Session & { user: NonNullable<Session["user"]> };
export type GuardResult =
  | { ok: true; session: AuthedSession; role: string }
  | { ok: false; response: NextResponse };

// Internal — actual session+role check. requireAdmin/requireEmployee wrap it.
async function requireRole(allowed: Set<string>): Promise<GuardResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const role = (session.user as { role?: string }).role;

  if (!role || !allowed.has(role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, session: session as AuthedSession, role };
}

// Owner + CSR — for true admin routes (employee/partner mgmt, payouts, audit
// logs, discounts, etc.). Use this by default for /api/admin/** routes.
export async function requireAdmin(): Promise<GuardResult> {
  return requireRole(ADMIN_ROLES);
}

// Owner + CSR + Cleaner — for routes that any authenticated employee uses,
// regardless of admin-ness:
//   - /api/admin/cleaners/**         (cleaner dashboards)
//   - /api/admin/employees/[id]      (any role's own profile page)
// Self-vs-other access is intentionally NOT enforced here (per 2026-05-25
// decision). The guard only blocks unauthenticated users and guests.
export async function requireEmployee(): Promise<GuardResult> {
  return requireRole(EMPLOYEE_ROLES);
}

// Backwards-compat alias kept in case anything imports the old type name.
export type AdminGuardResult = GuardResult;
