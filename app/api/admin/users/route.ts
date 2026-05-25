import {
  getAllAdminUsers,
  updateAdminUser,
  deleteAdminUser,
} from "@/backend/controller/adminUsersController";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/backend/utils/requireAdmin";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return getAllAdminUsers(req);
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return updateAdminUser(req);
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return deleteAdminUser(req);
}
