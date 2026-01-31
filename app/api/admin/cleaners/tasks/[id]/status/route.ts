import { NextRequest, NextResponse } from "next/server";
import { updateCleaningTask } from "@/backend/controller/cleanersController";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { cleaning_status } = body;

    if (!cleaning_status) {
      return NextResponse.json(
        { success: false, error: "Cleaning status is required" },
        { status: 400 }
      );
    }

    // Validate cleaning status
    const validStatuses = ["pending", "in-progress", "cleaned", "inspected"];
    if (!validStatuses.includes(cleaning_status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid cleaning status. Must be one of: pending, in-progress, cleaned, inspected",
        },
        { status: 400 }
      );
    }

    // Mock the URL structure for the controller
    const url = new URL(`/api/admin/cleaners/tasks/${params.id}`, req.url);
    const mockReq = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify({ cleaning_status }),
    }) as NextRequest;
    
    return updateCleaningTask(mockReq);
  } catch (error) {
    console.log("❌ Error updating cleaning status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update cleaning status",
      },
      { status: 500 }
    );
  }
}
