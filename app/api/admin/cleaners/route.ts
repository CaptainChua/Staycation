import { NextRequest, NextResponse } from "next/server";
import {
  getChecklistByHaven,
  saveChecklistProgress,
  submitChecklist,
  updateTask as controllerUpdateTask,
} from "@/backend/controller/cleaningChecklistController";
import { requireEmployee } from "@/backend/utils/requireAdmin";

export async function GET(req: NextRequest) {
  const guard = await requireEmployee();
  if (!guard.ok) return guard.response;
  return getChecklistByHaven(req);
}

export async function POST(req: NextRequest) {
  const guard = await requireEmployee();
  if (!guard.ok) return guard.response;
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body || {};

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action is required (save|submit)" },
        { status: 400 },
      );
    }

    // Wrap the request so controllers can call `req.json()` and receive the
    // already-parsed body. This prevents "Body has already been read" when
    // the controller calls `req.json()` after the route already consumed it.
    const reqWithParsedBody = { ...req, json: async () => body } as NextRequest;

    switch (action) {
      case "save":
        // Expect body: { checklist_id, tasks: [{ id, completed }, ...] }
        return saveChecklistProgress(reqWithParsedBody);
      case "submit": {
        // Inject the caller's role so the controller can bypass the
        // incomplete-task check for CSR and admin users.
        const sessionRole = (guard.session.user as { role?: string })?.role ?? "";
        const bodyWithRole = { ...body, role: sessionRole };
        const reqWithRole = { ...req, json: async () => bodyWithRole } as NextRequest;
        return submitChecklist(reqWithRole);
      }
      default:
        return NextResponse.json(
          { success: false, error: "Unknown action" },
          { status: 400 },
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/admin/cleaners error:", message);
    return NextResponse.json(
      { success: false, error: message || "Unexpected error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireEmployee();
  if (!guard.ok) return guard.response;
  try {
    // Accept body with a task identifier and new completed value:
    // { task_id: string, completed: boolean }
    const body = await req.json().catch(() => null);
    const taskId = body?.task_id || body?.taskId || body?.id;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "task_id is required in the body" },
        { status: 400 },
      );
    }

    // Wrap the request so controller can safely call req.json() without causing
    // "Body has already been read". The wrapped request returns the parsed
    // body when .json() is called.
    const reqWithParsedBody = { ...req, json: async () => body } as NextRequest;

    return controllerUpdateTask(reqWithParsedBody, {
      params: Promise.resolve({ taskId }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("PATCH /api/admin/cleaners error:", message);
    return NextResponse.json(
      { success: false, error: message || "Unexpected error" },
      { status: 500 },
    );
  }
}
