import { getAllDiscounts, createDiscount, updateDiscount, deleteDiscount, toggleDiscountStatus } from "@/backend/controller/discountsController";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/backend/utils/requireAdmin";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return getAllDiscounts(req);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return createDiscount(req);
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return updateDiscount(req);
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return deleteDiscount(req);
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return toggleDiscountStatus(req);
}
