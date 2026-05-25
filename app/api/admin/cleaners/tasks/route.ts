import { NextRequest, NextResponse } from "next/server";
import { getAllCleaningTasks } from "@/backend/controller/cleanersController";
import { requireEmployee } from "@/backend/utils/requireAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = await requireEmployee();
  if (!guard.ok) return guard.response;
  console.log("🚀 CLEANERS TASKS API CALLED");

  try {
    return await getAllCleaningTasks(req);
  } catch (error) {
    console.error("❌ Error in cleaners tasks route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get cleaning tasks",
        data: []
      },
      { status: 500 }
    );
  }
}
