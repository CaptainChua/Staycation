import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/backend/controller/messageController";

<<<<<<< HEAD
export async function GET(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }): Promise<NextResponse> {
  return getMessages(request, { params });
=======
interface RouteContext {
  params: Promise<{
    conversationId: string;
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { conversationId } = await params;
  return getMessages(request, { params: Promise.resolve({ conversationId }) });
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
}
