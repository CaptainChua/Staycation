import { getAllAdminRooms, updateHaven } from "@/backend/controller/roomController";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/backend/utils/requireAdmin";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return getAllAdminRooms(request);
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return updateHaven(request);
}

