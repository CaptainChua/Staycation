import { NextRequest, NextResponse } from "next/server";
import { getActivityStats } from "@/backend/controller/activityLogController";
import { createEdgeRouter } from "next-connect";

type RequestContext = Record<string, never>;

const router = createEdgeRouter<NextRequest, RequestContext>();
router.get(getActivityStats);

export async function GET(request: NextRequest, ctx: RequestContext): Promise<NextResponse> {
  return router.run(request, ctx) as Promise<NextResponse>;
}
