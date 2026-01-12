import { NextRequest, NextResponse } from "next/server";
import { getActivityStats } from "@/backend/controller/activityLogController";
import { createEdgeRouter } from "next-connect";

const router = createEdgeRouter<NextRequest, any>()
router.get(getActivityStats);

export async function GET(request: NextRequest, ctx: any): Promise<NextResponse> {
  return router.run(request, ctx) as Promise<NextResponse>;
}
