import { NextRequest, NextResponse } from "next/server";
import { getCleaningTaskById, updateCleaningTask } from "@/backend/controller/cleanersController";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log("🔍 API Route called: GET /api/admin/cleaners/tasks/[id]", id);
  try {
    // Mock the URL structure for the controller
    const url = new URL(`/api/admin/cleaners/tasks/${id}`, req.url);
    const mockReq = new Request(url, {
      method: req.method,
      headers: req.headers,
    }) as NextRequest;
    
    console.log("📋 Calling getCleaningTaskById with ID:", id);
    const result = await getCleaningTaskById(mockReq);
    console.log("✅ getCleaningTaskById result:", result);
    return result;
  } catch (error) {
    console.error("❌ API Route Error in GET:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get cleaning task",
        details: String(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log("🔍 API Route called: PUT /api/admin/cleaners/tasks/[id]", id);
  try {
    // Read the request body first
    let body;
    try {
      body = await req.json();
      console.log("📦 Request body:", body);
    } catch (bodyError) {
      console.error("❌ Error reading request body:", bodyError);
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Mock the URL structure for the controller
    const url = new URL(`/api/admin/cleaners/tasks/${id}`, req.url);
    const mockReq = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify(body),
    }) as NextRequest;
    
    console.log("📋 Calling updateCleaningTask with ID:", id);
    const result = await updateCleaningTask(mockReq);
    console.log("✅ updateCleaningTask result:", result);
    return result;
  } catch (error) {
    console.error("❌ API Route Error in PUT:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update cleaning task",
        details: String(error)
      },
      { status: 500 }
    );
  }
}
