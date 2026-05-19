import { NextRequest, NextResponse } from "next/server";
import { getPhotosByHaven } from "@/backend/controller/cleaningChecklistController";

export async function GET(req: NextRequest) {
  return getPhotosByHaven(req);
}