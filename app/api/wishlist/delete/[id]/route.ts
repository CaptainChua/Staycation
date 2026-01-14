import { NextRequest, NextResponse } from "next/server";
import { removeFromWishlist } from "@/backend/controller/wishlistController";

<<<<<<< HEAD
type RouteContext = {
=======
interface RouteContext {
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
  params: Promise<{
    id: string;
  }>;
};

<<<<<<< HEAD
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
=======
export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
  const { id } = await params;
  return removeFromWishlist(request, { params: Promise.resolve({ id }) });
}
