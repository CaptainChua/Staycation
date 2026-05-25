import { NextRequest, NextResponse } from "next/server";
import { getAllPartners, createPartner } from "@/backend/controller/partnersController";
import { requireAdmin } from "@/backend/utils/requireAdmin";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return await getAllPartners(req);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return await createPartner(req);
}
