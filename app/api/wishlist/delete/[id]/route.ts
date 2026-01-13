import { NextRequest, NextResponse } from "next/server";
import { removeFromWishlist } from "@/backend/controller/wishlistController";

interface RouteContext {
  params: Promise<{
    id: string;
  }>
}

export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params;
  return removeFromWishlist(request, { params: Promise.resolve({ id }) });
}
