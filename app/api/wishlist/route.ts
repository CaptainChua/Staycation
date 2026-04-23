import { NextRequest, NextResponse } from "next/server";
import { addToWishlist } from "@/backend/controller/wishlistController";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return addToWishlist(request);
}
