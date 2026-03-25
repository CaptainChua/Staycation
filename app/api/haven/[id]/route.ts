import { getHavenById, updateHaven } from "@/backend/controller/roomController";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    id: string;
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  return getHavenById(request, { params });
}

export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Handle pricing-only updates
    if (body.six_hour_price !== undefined || body.ten_hour_price !== undefined || 
        body.weekday_price !== undefined || body.weekend_price !== undefined) {
      // Map price fields to rate fields for the updateHaven function
      const updateBody = {
        id,
        haven_name: body.haven_name || "",
        tower: body.tower || "",
        floor: body.floor || "",
        view_type: body.view_type || "",
        capacity: body.capacity || 1,
        room_size: body.room_size || "",
        beds: body.beds || 1,
        description: body.description || "",
        six_hour_rate: body.six_hour_price,
        ten_hour_rate: body.ten_hour_price,
        weekday_rate: body.weekday_price,
        weekend_rate: body.weekend_price,
      };
      
      const updatedRequest = new NextRequest(request, {
        body: JSON.stringify(updateBody),
      });
      
      return updateHaven(updatedRequest);
    }
    
    const updatedRequest = new NextRequest(request, {
      body: JSON.stringify({
        ...body,
        id,
      }),
    });
    
    return updateHaven(updatedRequest);
  } catch (error) {
    console.error("[haven/[id] PUT] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update haven" },
      { status: 500 }
    );
  }
}