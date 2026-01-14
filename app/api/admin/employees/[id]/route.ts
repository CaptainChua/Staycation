import { NextRequest, NextResponse } from "next/server";
<<<<<<< HEAD
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
  _params: RouteContext
): Promise<NextResponse> {
  return getEmployeeById(request);
}

export async function PUT(
  request: NextRequest,
  _params: RouteContext
): Promise<NextResponse> {
  return updateEmployee(request);
}

export async function DELETE(
  request: NextRequest,
  _params: RouteContext
): Promise<NextResponse> {
  return deleteEmployee(request);
}
=======
import { getEmployeeById, updateEmployee, deleteEmployee } from "@/backend/controller/employeeController";

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id: _id } = await params;
  return getEmployeeById(request);
}

export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id: _id } = await params;
  return updateEmployee(request);
}

export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id: _id } = await params;
  return deleteEmployee(request);
}
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
