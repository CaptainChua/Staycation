import { NextRequest, NextResponse } from "next/server";
import { getUserWishlist } from "@/backend/controller/wishlistController";

<<<<<<< HEAD
type RouteContext = {
=======
interface RouteContext {
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
  params: Promise<{
    userId: string;
  }>;
};

<<<<<<< HEAD
export async function GET(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
=======
export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
  const { userId } = await params;
  return getUserWishlist(request, { params: Promise.resolve({ userId }) });
}
