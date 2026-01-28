import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";

const BOOKING_TABLE = (() => {
  const raw = (process.env.BOOKING_TABLE_NAME || "booking").trim();
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(raw)) return raw;
  console.warn("Invalid BOOKING_TABLE_NAME, defaulting to 'booking'");
  return "booking";
})();

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("booking_id");

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Booking ID is required" },
        { status: 400 }
      );
    }

    const query = `
      SELECT * FROM ${BOOKING_TABLE}
      WHERE booking_id = $1
    `;

    const result = await pool.query(query, [bookingId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: result.rows[0],
    });
  } catch (error: unknown) {
    console.error("Error fetching booking:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch booking";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
