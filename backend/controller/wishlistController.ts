import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";

type QueryParams = (string | number | null)[];

export interface WishlistItem {
  id?: string;
  user_id: string;
  haven_id: string;
  created_at?: string;
}

// GET User's Wishlist
// Supports both logged-in users (UUID) and guest users (guest tokens prefixed with `guest_`)
export const getUserWishlist = async (
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
): Promise<NextResponse> => {
  const { userId } = await params;

  try {
    // Base select with guest_token included
    let query = `
      SELECT
        w.id,
        w.user_id,
        w.guest_token,
        w.haven_id,
        w.created_at,
        h.haven_name as room_name,
        h.tower,
        h.capacity,
        h.description,
        h.six_hour_rate as price,
        COALESCE(
          json_agg(hi.image_url ORDER BY hi.display_order)
          FILTER (WHERE hi.id IS NOT NULL),
          '[]'
        ) as images
      FROM wishlist w
      INNER JOIN havens h ON w.haven_id = h.uuid_id
      LEFT JOIN haven_images hi ON h.uuid_id = hi.haven_id
    `;

    // Decide whether to query by user_id or guest_token
    const values: unknown[] = [];
    if (userId && userId.startsWith("guest_")) {
      const guestToken = userId.replace(/^guest_/, "");
      query += ` WHERE w.guest_token = $1`;
      values.push(guestToken);
    } else {
      query += ` WHERE w.user_id = $1`;
      values.push(userId);
    }

    query += ` GROUP BY w.id, h.haven_name, h.tower, h.capacity, h.description, h.six_hour_rate
      ORDER BY w.created_at DESC
    `;

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: unknown) {
    console.error("Error fetching wishlist:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch wishlist",
        error: errMsg,
      },
      { status: 500 },
    );
  }
};

// ADD to Wishlist
// Allows adding either with `user_id` (logged-in users) or `guest_token` (guest users)
export const addToWishlist = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { user_id, guest_token, haven_id } = body;

    if ((!user_id && !guest_token) || !haven_id) {
      return NextResponse.json(
        {
          success: false,
          message: "user_id (or guest_token) and haven_id are required",
        },
        { status: 400 },
      );
    }

    // Check if already in wishlist (support guest tokens)
    let checkQuery = "";
    let checkValues: unknown[] = [];

    if (guest_token) {
      checkQuery = `
        SELECT id FROM wishlist
        WHERE guest_token = $1 AND haven_id = $2
      `;
      checkValues = [guest_token, haven_id];
    } else {
      checkQuery = `
        SELECT id FROM wishlist
        WHERE user_id = $1 AND haven_id = $2
      `;
      checkValues = [user_id, haven_id];
    }

    const checkResult = await pool.query(
      checkQuery,
      checkValues as QueryParams,
    );

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Item already in wishlist",
        },
        { status: 400 },
      );
    }

    // Add to wishlist
    let insertQuery = "";
    let insertValues: unknown[] = [];

    if (guest_token) {
      insertQuery = `
        INSERT INTO wishlist (guest_token, haven_id)
        VALUES ($1, $2)
        RETURNING *
      `;
      insertValues = [guest_token, haven_id];
    } else {
      insertQuery = `
        INSERT INTO wishlist (user_id, haven_id)
        VALUES ($1, $2)
        RETURNING *
      `;
      insertValues = [user_id, haven_id];
    }

    const result = await pool.query(insertQuery, insertValues as QueryParams);

    return NextResponse.json({
      success: true,
      message: "Added to wishlist successfully",
      data: result.rows[0],
    });
  } catch (error: unknown) {
    console.error("Error adding to wishlist:", error);
    const errMsg = error instanceof Error ? error.message : String(error);

    // Helpful fallback when the DB schema hasn't been migrated yet and the
    // `guest_token` column is missing (common during rollouts).
    if (
      errMsg.toLowerCase().includes("guest_token") &&
      errMsg.toLowerCase().includes("does not exist")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Database schema missing `guest_token` column. Please apply the migration to add guest wishlist support (see backend/migrations/2026-02-04_add_guest_token_to_wishlist.sql).",
          error: errMsg,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add to wishlist",
        error: errMsg,
      },
      { status: 500 },
    );
  }
};

// REMOVE from Wishlist
export const removeFromWishlist = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  const { id } = await params;

  try {
    const deleteQuery = `
      DELETE FROM wishlist
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Wishlist item not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Removed from wishlist successfully",
      data: result.rows[0],
    });
  } catch (error: unknown) {
    console.error("Error removing from wishlist:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove from wishlist",
        error: errMsg,
      },
      { status: 500 },
    );
  }
};

// CHECK if item is in wishlist
// Supports checking by either user id or guest token (guest identifiers sent as `guest_<token>`)
export const checkWishlistStatus = async (
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; havenId: string }> },
): Promise<NextResponse> => {
  const { userId, havenId } = await params;

  try {
    let query = "";
    let values: unknown[] = [];

    if (userId && userId.startsWith("guest_")) {
      const guestToken = userId.replace(/^guest_/, "");
      query = `
        SELECT id FROM wishlist
        WHERE guest_token = $1 AND haven_id = $2
      `;
      values = [guestToken, havenId];
    } else {
      query = `
        SELECT id FROM wishlist
        WHERE user_id = $1 AND haven_id = $2
      `;
      values = [userId, havenId];
    }

    const result = await pool.query(query, values as QueryParams);

    return NextResponse.json({
      success: true,
      isInWishlist: result.rows.length > 0,
      wishlistId: result.rows.length > 0 ? result.rows[0].id : null,
    });
  } catch (error: unknown) {
    console.error("Error checking wishlist status:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to check wishlist status",
        error: errMsg,
      },
      { status: 500 },
    );
  }
};
