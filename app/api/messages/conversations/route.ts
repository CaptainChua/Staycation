import { NextRequest, NextResponse } from "next/server";
import { getConversations, createConversation } from "@/backend/controller/messageController";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return getConversations(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return createConversation(request);
}
