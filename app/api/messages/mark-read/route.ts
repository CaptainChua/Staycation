import { NextRequest, NextResponse } from "next/server";
import { markMessagesAsRead } from "@/backend/controller/messageController";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return markMessagesAsRead(request);
}