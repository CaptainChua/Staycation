import { loginEmployee } from "@/backend/controller/employeeController";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return loginEmployee(request);
}