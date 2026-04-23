import { NextRequest, NextResponse } from "next/server";
import { getAllCleaningTasks } from "@/backend/controller/cleanersController";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
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
