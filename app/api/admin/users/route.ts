import {
  getAllAdminUsers,
  updateAdminUser,
  deleteAdminUser,
} from "@/backend/controller/adminUsersController";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return getAllAdminUsers(req);
}

export async function PUT(req: NextRequest) {
  return updateAdminUser(req);
}

export async function DELETE(req: NextRequest) {
  return deleteAdminUser(req);
}
