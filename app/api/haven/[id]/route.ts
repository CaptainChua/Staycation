import { getHavenById } from "@/backend/controller/roomController";
import { createEdgeRouter } from "next-connect";
import { NextRequest, NextResponse } from "next/server";

interface RequestContext {
    params: {
        id: string;
    }
}

const router = createEdgeRouter<NextRequest, RequestContext>();
router.get(getHavenById);

export async function GET (req: NextRequest, ctx: { params: Promise<{ id: string }> }):Promise<NextResponse> {
    const params = await ctx.params;
    return router.run(req, { params }) as Promise<NextResponse>
}