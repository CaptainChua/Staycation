import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/backend/controller/messageController";

export async function GET(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }): Promise<NextResponse> {
  return getMessages(request, { params });
}
