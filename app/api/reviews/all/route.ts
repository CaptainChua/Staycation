import { NextRequest, NextResponse } from "next/server";
import { GET as reviewsGET } from "../route";

// Forward /api/reviews/all to the main reviews GET handler
export async function GET(req: NextRequest) {
  return reviewsGET(req as NextRequest);
}
