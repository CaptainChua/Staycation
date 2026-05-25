import { NextRequest, NextResponse } from "next/server";
import { getEmployeeById, updateEmployee, deleteEmployee } from "@/backend/controller/employeeController";
import { requireAdmin, requireEmployee } from "@/backend/utils/requireAdmin";

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

// GET / PUT — any authenticated employee. Profile pages for Cleaner / CSR /
// Owner all hit this for self-edit; per the 2026-05-25 decision, the guard
// only blocks unauthenticated users, not cross-employee reads/writes.
// DELETE — admin only (removing an employee account is a CSR/Owner action).

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const guard = await requireEmployee();
  if (!guard.ok) return guard.response;
  await params;
  return getEmployeeById(request);
}

export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const guard = await requireEmployee();
  if (!guard.ok) return guard.response;
  await params;
  return updateEmployee(request);
}

export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  await params;
  return deleteEmployee(request);
}
