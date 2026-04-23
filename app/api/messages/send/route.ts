import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/backend/controller/messageController";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return sendMessage(request);
}
