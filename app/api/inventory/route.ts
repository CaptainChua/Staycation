import {
  createInventoryItem,
  deleteInventoryItem,
  getAllInventory,
  getInventoryItemById,
  updateInventoryItem,
} from "@/backend/controller/inventoryController";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const item_id = searchParams.get("item_id");

  // If item_id is provided, get single item with view logging
  if (item_id) {
    return getInventoryItemById(request);
  }

  // Otherwise, get all inventory
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
