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