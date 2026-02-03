import { NextRequest, NextResponse } from "next/server";
import {
  getCleaningTaskById,
  updateCleaningTask,
} from "@/backend/controller/cleanersController";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  await params;
  return getCleaningTaskById(request);
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  await params;
  return updateCleaningTask(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  await params;
  return updateCleaningTask(request);
}
