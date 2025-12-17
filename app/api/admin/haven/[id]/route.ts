import { deleteHaven, updateHaven, getHavenById } from "@/backend/controller/roomController";
import { createEdgeRouter } from "next-connect";
import { NextRequest, NextResponse } from "next/server";

interface RequestContext {
    params: Promise<{
        id: string
    }>
};

const router = createEdgeRouter<NextRequest, RequestContext>();

router.get(getHavenById);
router.put(updateHaven);
router.delete(deleteHaven);

export async function GET(req: NextRequest, ctx: RequestContext): Promise<NextResponse> {
    return router.run(req, ctx) as Promise<NextResponse>
}

export async function PUT(req: NextRequest, ctx: RequestContext): Promise<NextResponse> {
    return router.run(req, ctx) as Promise<NextResponse>
}

export async function DELETE(req: NextRequest, ctx: RequestContext): Promise<NextResponse> {
    return router.run(req, ctx) as Promise<NextResponse>
}
