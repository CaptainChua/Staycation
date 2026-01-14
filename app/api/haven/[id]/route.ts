import { getHavenById } from "@/backend/controller/roomController";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    id: string;
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params;
  return getHavenById(request, { params: Promise.resolve({ id }) });
}