import { NextRequest, NextResponse } from "next/server";
import { getAllPartners, createPartner } from "@/backend/controller/partnersController";

export async function GET(req: NextRequest) {
  return await getAllPartners(req);
}

export async function POST(req: NextRequest) {
  return await createPartner(req);
}
