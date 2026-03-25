import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/backend/controller/messageController";

interface RouteContext {
  params: Promise<{
    conversationId: string;
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { conversationId } = await params;
  return getMessages(request, { params: Promise.resolve({ conversationId }) });
}
