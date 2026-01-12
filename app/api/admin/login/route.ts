// import { NextResponse } from 'next/server';
// import pool from '@/backend/config/db';
// import bcrypt from 'bcryptjs';

import { loginEmployee } from "@/backend/controller/employeeController";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return loginEmployee(request);
}