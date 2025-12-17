import { getAllAdminRooms, updateHaven } from "@/backend/controller/roomController";
import { createEdgeRouter } from "next-connect";
import { NextRequest, NextResponse } from "next/server";

interface RequestContext {};

const router = createEdgeRouter<NextRequest, RequestContext>();

router.get(getAllAdminRooms);
router.put(updateHaven);

export async function GET (req: NextRequest, ctx: RequestContext):Promise<NextResponse> {
    return router.run(req, ctx) as Promise<NextResponse>
}

