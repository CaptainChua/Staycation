import { NextRequest, NextResponse } from "next/server";
import { getActivityStats } from "@/backend/controller/activityLogController";
import { createEdgeRouter } from "next-connect";

const router = createEdgeRouter<NextRequest, { params: Record<string, string> }>()
router.get(getActivityStats);

export async function GET(request: NextRequest, { params }: { params: Record<string, string> }): Promise<NextResponse> {
  return router.run(request, { params }) as Promise<NextResponse>;
}
