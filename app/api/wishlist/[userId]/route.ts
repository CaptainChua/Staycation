import { NextRequest, NextResponse } from "next/server";
import { getUserWishlist } from "@/backend/controller/wishlistController";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { userId } = await params;
  return getUserWishlist(request, { params: Promise.resolve({ userId }) });
}
