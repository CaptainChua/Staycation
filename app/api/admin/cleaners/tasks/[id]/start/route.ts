import { NextRequest, NextResponse } from "next/server";
import { updateCleaningTask } from "@/backend/controller/cleanersController";
import { requireEmployee } from "@/backend/utils/requireAdmin";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireEmployee();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await params;
    // Mock the URL structure for the controller
    const url = new URL(`/api/admin/cleaners/tasks/${id}`, req.url);
    const mockReq = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify({ 
        cleaning_status: "in-progress",
        cleaning_time_in: new Date().toISOString()
      }),
    }) as NextRequest;
    
    return updateCleaningTask(mockReq);
  } catch (error) {
    console.log("❌ Error starting cleaning:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start cleaning",
      },
      { status: 500 }
    );
  }
}
