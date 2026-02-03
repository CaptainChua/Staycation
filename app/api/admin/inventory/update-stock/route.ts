import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { itemName, quantity, operation } = await request.json();

    if (!itemName || !quantity || !operation) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: itemName, quantity, operation" },
        { status: 400 }
      );
    }

    if (operation !== 'subtract') {
      return NextResponse.json(
        { success: false, error: "Only 'subtract' operation is supported" },
        { status: 400 }
      );
    }

    // Find matching inventory items (case-insensitive and flexible matching)
    const searchQuery = `
      SELECT item_id, item_name, current_stock, category 
      FROM inventory 
      WHERE LOWER(item_name) = LOWER($1)
         OR LOWER(item_name) = LOWER(REPLACE($1, ' ', ''))
         OR REPLACE(LOWER(item_name), ' ', '') = LOWER(REPLACE($1, ' ', ''))
         OR LOWER(item_name) LIKE LOWER($1)
    `;
    
    const searchResult = await pool.query(searchQuery, [itemName.trim()]);
    
    if (searchResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `No inventory item found matching: ${itemName}` },
        { status: 404 }
      );
    }

    // Use the first match (could be enhanced to handle multiple matches)
    const inventoryItem = searchResult.rows[0];
    const newStock = Math.max(0, inventoryItem.current_stock - quantity);

    // Update the inventory stock
    const updateQuery = `
      UPDATE inventory 
      SET current_stock = $1, updated_at = NOW()
      WHERE item_id = $2
      RETURNING item_id, item_name, current_stock, category
    `;

    const updateResult = await pool.query(updateQuery, [newStock, inventoryItem.item_id]);
    const updatedItem = updateResult.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        item: updatedItem,
        previousStock: inventoryItem.current_stock,
        quantitySubtracted: quantity,
        newStock: newStock
      },
      message: `Successfully subtracted ${quantity} from ${updatedItem.item_name}. New stock: ${newStock}`
    });

  } catch (error) {
    console.error("Error updating inventory stock:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
