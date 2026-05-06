import { NextRequest } from "next/server";
import { getAvailableRooms } from "@/backend/controller/roomsController";

export async function GET(req: NextRequest) {
  return getAvailableRooms(req);
}

