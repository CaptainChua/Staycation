import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/backend/controller/messageController";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return sendMessage(request);
<<<<<<< HEAD
}
=======
}
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
