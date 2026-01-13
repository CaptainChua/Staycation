import { NextRequest, NextResponse } from 'next/server';
import { createEmployee, getAllEmployees } from '@/backend/controller/employeeController';

export async function GET(request: NextRequest): Promise<NextResponse> {
  return getAllEmployees(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return createEmployee(request);
}