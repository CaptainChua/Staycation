import { getAllAdminRooms, updateHaven } from "@/backend/controller/roomController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return getAllAdminRooms(request);
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  return updateHaven(request);
}

