import { NextRequest, NextResponse } from "next/server";
import { getPartnerById, updatePartner, deletePartner } from "@/backend/controller/partnersController";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return await getPartnerById(req, ctx);
}

export async function PUT(req: NextRequest) {
  return await updatePartner(req);
}

export async function DELETE(req: NextRequest) {
  return await deletePartner(req);
}
