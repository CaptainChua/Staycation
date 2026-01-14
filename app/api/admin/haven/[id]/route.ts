import { deleteHaven, updateHaven, getHavenById } from "@/backend/controller/roomController";
import { NextRequest, NextResponse } from "next/server";

<<<<<<< HEAD
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  return getHavenById(request, { params });
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  return updateHaven(request);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  return deleteHaven(request, { params });
}
=======
interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params;
  return getHavenById(request, { params: Promise.resolve({ id }) });
}

export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id: _id } = await params;
  return updateHaven(request);
}

export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params;
  return deleteHaven(request, { params: Promise.resolve({ id }) });
}
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
