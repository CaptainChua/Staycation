import { getAllHavens } from "@/backend/controller/roomController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return getAllHavens(request);
}