import { NextRequest, NextResponse } from "next/server";
import { updateCleaningTask } from "@/backend/controller/cleanersController";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Mock the URL structure for the controller
    const url = new URL(`/api/admin/cleaners/tasks/${id}`, req.url);
    const mockReq = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify({ 
        cleaning_status: "cleaned",
        cleaning_time_out: new Date().toISOString(),
        cleaned_at: new Date().toISOString()
      }),
    }) as NextRequest;
    
    return updateCleaningTask(mockReq);
  } catch (error) {
    console.log("❌ Error completing cleaning:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to complete cleaning",
      },
      { status: 500 }
    );
  }
}
