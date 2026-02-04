import { getAllDiscounts, createDiscount, updateDiscount, deleteDiscount, toggleDiscountStatus } from "@/backend/controller/discountsController";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return getAllDiscounts(req);
}

export async function POST(req: NextRequest) {
  return createDiscount(req);
}

export async function PUT(req: NextRequest) {
  return updateDiscount(req);
}

export async function DELETE(req: NextRequest) {
  return deleteDiscount(req);
}

export async function PATCH(req: NextRequest) {
  return toggleDiscountStatus(req);
}
