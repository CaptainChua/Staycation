import { NextRequest } from "next/server";
import {
  getAllActivityLogs,
  createActivityLog,
  deleteActivityLog,
} from "@/backend/controller/activityLogController";

export async function GET(request: NextRequest) {
  return getAllActivityLogs(request);
}

export async function POST(request: NextRequest) {
  return createActivityLog(request);
}

export async function DELETE(request: NextRequest) {
  return deleteActivityLog(request);
}
