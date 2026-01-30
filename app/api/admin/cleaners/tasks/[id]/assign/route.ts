import { NextRequest, NextResponse } from "next/server";
import { updateCleaningTask } from "@/backend/controller/cleanersController";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { assigned_to } = body;

    if (!assigned_to) {
      return NextResponse.json(
        { success: false, error: "Cleaner ID is required" },
        { status: 400 }
      );
    }

    // Mock the URL structure for the controller
    const url = new URL(`/api/admin/cleaners/tasks/${params.id}`, req.url);
    const mockReq = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify({ assigned_to }),
    }) as NextRequest;
    
    return updateCleaningTask(mockReq);
  } catch (error) {
    console.log("❌ Error assigning cleaner:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to assign cleaner",
      },
      { status: 500 }
    );
  }
}
