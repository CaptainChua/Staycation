import { NextRequest, NextResponse } from "next/server";
import { getEmployeeById, updateEmployee, deleteEmployee } from "@/backend/controller/employeeController";

export async function GET(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  return getEmployeeById(request, params);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  return updateEmployee(request, params);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  return deleteEmployee(request, params);
}
