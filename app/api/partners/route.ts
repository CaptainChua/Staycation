import { NextRequest } from "next/server";
import { getAllPartners, createPartner } from "@/backend/controller/partnersController";

export async function GET(req: NextRequest) {
  return getAllPartners(req);
}

export async function POST(req: NextRequest) {
  return createPartner(req);
}