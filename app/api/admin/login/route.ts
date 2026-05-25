import { loginEmployee } from "@/backend/controller/employeeController";
import { NextRequest, NextResponse } from "next/server";

// PUBLIC BY DESIGN — this IS the login endpoint. Authenticates via
// email+password in the body. Must NOT call requireAdmin(). See
// backend/utils/requireAdmin.ts for the full exemption list.
export async function POST(request: NextRequest): Promise<NextResponse> {
  return loginEmployee(request);
}