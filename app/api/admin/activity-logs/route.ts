import { NextRequest } from "next/server";
import {
  getAllActivityLogs,
  createActivityLog,
  deleteActivityLog,
} from "@/backend/controller/activityLogController";
import { requireAdmin, requireEmployee } from "@/backend/utils/requireAdmin";

// GET / DELETE — admin only (viewing or clearing the log).
// POST — any authenticated employee (Cleaner included) records their own
// activity from profile/booking/payment pages.

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return getAllActivityLogs(request);
}

export async function POST(request: NextRequest) {
  const guard = await requireEmployee();
  if (!guard.ok) return guard.response;
  return createActivityLog(request);
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return deleteActivityLog(request);
}
