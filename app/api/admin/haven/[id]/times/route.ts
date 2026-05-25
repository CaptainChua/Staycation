import { NextRequest, NextResponse } from "next/server";
import { PoolClient } from "pg";
import pool from "@/backend/config/db";

// NOTE: Despite living under /api/admin/**, this route is called from
// Components/Checkout.tsx by UNAUTHENTICATED guests during the booking flow
// to fetch check-in/out times for the selected haven. Must NOT call
// requireAdmin(). Consider relocating to /api/havens/[id]/times in a future
// refactor so the URL matches the access model.

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface BookingTypeRow {
  duration: number;
  first_check_in: string;
  last_check_in: string;
}

async function ensureColumn(client: PoolClient) {
  await client.query(`
    ALTER TABLE havens
    ADD COLUMN IF NOT EXISTS booking_windows JSONB
    DEFAULT '{"types":[]}'::jsonb
  `);
}

function addHours(time: string, hours: number): string {
  if (!time) return "00:00";
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + hours * 60;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const client = await pool.connect();
  try {
    await ensureColumn(client);

    const result = await client.query(
      `SELECT uuid_id, haven_name,
              six_hour_check_in, six_hour_check_out,
              ten_hour_check_in, ten_hour_check_out,
              twenty_one_hour_check_in, twenty_one_hour_check_out,
              booking_windows
       FROM havens WHERE uuid_id = $1`,
      [id]
    );
    if (result.rows.length === 0)
      return NextResponse.json({ error: "Haven not found" }, { status: 404 });

    const row = result.rows[0];
    const bw = row.booking_windows ?? { types: [] };

    // Migrate legacy single-value columns into types array if types is empty
    if (!bw.types?.length) {
      const trim = (t: string) => (t ? String(t).slice(0, 5) : "");
      bw.types = [];
      if (row.six_hour_check_in) {
        bw.types.push({
          name: "6-Hour Booking",
          duration: 6,
          price: 999,
          available_days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
          first_check_in: trim(row.six_hour_check_in),
          last_check_in: trim(row.six_hour_check_in),
        });
      }
      if (row.ten_hour_check_in) {
        bw.types.push({
          name: "10-Hour Booking",
          duration: 10,
          price: 1599,
          available_days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
          first_check_in: trim(row.ten_hour_check_in),
          last_check_in: trim(row.ten_hour_check_in),
        });
      }
      if (row.twenty_one_hour_check_in) {
        bw.types.push({
          name: "21-Hour Booking",
          duration: 21,
          price: 799,
          available_days: ["Sun", "Mon", "Tue", "Wed", "Thu"],
          first_check_in: trim(row.twenty_one_hour_check_in),
          last_check_in: trim(row.twenty_one_hour_check_in),
        });
      }
    }

    return NextResponse.json({ success: true, data: { ...row, booking_windows: bw } });
  } finally {
    client.release();
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await req.json();
  const { booking_windows } = body;

  if (!booking_windows) {
    return NextResponse.json({ error: "booking_windows is required" }, { status: 400 });
  }

  // Sync legacy columns from the first type matching each duration
  const types: BookingTypeRow[] = booking_windows.types ?? [];
  const sixHour = types.find((t) => t.duration === 6);
  const tenHour = types.find((t) => t.duration === 10);
  const twentyOneHour = types.find((t) => t.duration === 21);

  const client = await pool.connect();
  try {
    await ensureColumn(client);

    await client.query(
      `UPDATE havens SET
         booking_windows = $1,
         six_hour_check_in = $2,
         six_hour_check_out = $3,
         ten_hour_check_in = $4,
         ten_hour_check_out = $5,
         twenty_one_hour_check_in = $6,
         twenty_one_hour_check_out = $7,
         updated_at = NOW()
       WHERE uuid_id = $8`,
      [
        JSON.stringify(booking_windows),
        sixHour?.first_check_in ?? null,
        sixHour ? addHours(sixHour.first_check_in, sixHour.duration) : null,
        tenHour?.first_check_in ?? null,
        tenHour ? addHours(tenHour.first_check_in, tenHour.duration) : null,
        twentyOneHour?.first_check_in ?? null,
        twentyOneHour ? addHours(twentyOneHour.first_check_in, twentyOneHour.duration) : null,
        id,
      ]
    );
    return NextResponse.json({ success: true, message: "Times updated successfully" });
  } finally {
    client.release();
  }
}
