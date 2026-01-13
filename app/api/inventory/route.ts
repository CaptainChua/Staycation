import {
  createInventoryItem,
  deleteInventoryItem,
  getAllInventory,
  updateInventoryItem,
} from "@/backend/controller/inventoryController";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return getAllInventory(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return createInventoryItem(request);
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  return updateInventoryItem(request);
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return deleteInventoryItem(request);
}
