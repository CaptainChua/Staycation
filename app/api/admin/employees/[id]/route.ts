import { NextRequest, NextResponse } from "next/server";
import {
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "@/backend/controller/employeeController";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id } = await params;
  return getEmployeeById(request, { id });
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id } = await params;
  return updateEmployee(request, { id });
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id } = await params;
  return deleteEmployee(request, { id });
}
