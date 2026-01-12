import { getHavenById } from "@/backend/controller/roomController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  return getHavenById(request, { params });
}