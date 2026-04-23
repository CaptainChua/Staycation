import { createHaven } from "@/backend/controller/roomController";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return createHaven(request);
}