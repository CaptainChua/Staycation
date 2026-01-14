import { NextRequest, NextResponse } from "next/server";
import { checkWishlistStatus } from "@/backend/controller/wishlistController";

<<<<<<< HEAD
type RouteContext = {
  params: Promise<{
    userId: string;
    havenId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
=======
interface RouteContext {
  params: Promise<{
    userId: string;
    havenId: string;
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
  const { userId, havenId } = await params;
  return checkWishlistStatus(request, { params: Promise.resolve({ userId, havenId }) });
}

