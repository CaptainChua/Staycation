import {
  getAllBlockedDates,
  createBlockedDate,
  updateBlockedDate,
  deleteBlockedDate,
} from "@/backend/controller/blockedDatesController";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return getAllBlockedDates(req);
}

export async function POST(req: NextRequest) {
  return createBlockedDate(req);
}

export async function PUT(req: NextRequest) {
  return updateBlockedDate(req);
}

export async function DELETE(req: NextRequest) {
  return deleteBlockedDate(req);
}
