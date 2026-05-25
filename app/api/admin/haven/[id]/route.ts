import { deleteHaven, updateHaven, getHavenById } from "@/backend/controller/roomController";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/backend/utils/requireAdmin";

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  return getHavenById(request, { params: Promise.resolve({ id }) });
}

export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  await params;
  return updateHaven(request);
}

export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  return deleteHaven(request, { params: Promise.resolve({ id }) });
}
