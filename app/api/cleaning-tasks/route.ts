import { NextRequest, NextResponse } from "next/server";
import { getAllCleaningTasks } from "@/backend/controller/cleanersController";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return getAllCleaningTasks(request);
}
