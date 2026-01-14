import { NextRequest, NextResponse } from "next/server";
<<<<<<< HEAD
import {
  getConversations,
  createConversation,
} from "@/backend/controller/messageController";
=======
import { getConversations, createConversation } from "@/backend/controller/messageController";
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c

export async function GET(request: NextRequest): Promise<NextResponse> {
  return getConversations(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return createConversation(request);
<<<<<<< HEAD
}
=======
}
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
