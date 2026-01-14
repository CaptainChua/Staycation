import { NextRequest, NextResponse } from "next/server";
import { checkWishlistStatus } from "@/backend/controller/wishlistController";

interface RouteContext {
  params: Promise<{
    userId: string;
    havenId: string;
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { userId, havenId } = await params;
  return checkWishlistStatus(request, { params: Promise.resolve({ userId, havenId }) });
}

