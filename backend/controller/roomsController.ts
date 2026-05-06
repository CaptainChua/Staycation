import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "../config/db";

export interface HavenAvailability {
  uuid_id: string;
  haven_name: string;
  tower: string;
  floor: string;
  view_type: string;
  capacity: number;
  room_size: string;
  beds: string;
  description: string;
  youtube_url?: string | null;
  six_hour_rate: number;
  ten_hour_rate: number;
  weekday_rate: number;
  weekend_rate: number;
}

const allowedRolesForAvailability = [
  "Owner",
  "CSR",
  "Cleaner",
  "Partner",
  "WalkInStaff",
] as const;

const normalizeRole = (role: unknown): string => String(role || "").toLowerCase();

const isAllowed = (role: unknown) => {
  const r = String(role || "");
  return (allowedRolesForAvailability as unknown as string[]).includes(r);
};

export const getAvailableRooms = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const role = token?.role;
    if (!isAllowed(role) && normalizeRole(role) !== "walkinstaff") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: "checkIn and checkOut are required" },
        { status: 400 },
      );
    }

    // Expected format: 'YYYY-MM-DD HH:MM' or full ISO timestamp.
    // We pass them to Postgres as timestamp params and adjust end-time when time is '00:00'.
    const query = `
      WITH params AS (
        SELECT
          $1::timestamp AS selected_start_ts,
          $2::timestamp AS selected_end_ts,
          to_char($2::timestamp, 'HH24:MI') AS selected_end_time,
          ($1::timestamp)::date AS selected_start_date,
          ($2::timestamp)::date AS selected_end_date
      )
      SELECT
        h.uuid_id,
        h.haven_name,
        h.tower,
        h.floor,
        h.view_type,
        h.capacity,
        h.room_size,
        h.beds,
        h.description,
        h.youtube_url,
        h.six_hour_rate,
        h.ten_hour_rate,
        h.weekday_rate,
        h.weekend_rate
      FROM havens h
      WHERE NOT EXISTS (
        SELECT 1
        FROM booking b
        CROSS JOIN params
        WHERE TRIM(b.room_name) = TRIM(h.haven_name)
          AND b.status NOT IN ('rejected', 'cancelled')
          AND params.selected_start_ts <
            (CASE
              WHEN b.check_out_time = '00:00'
                AND b.check_out_date::date = b.check_in_date::date
              THEN (b.check_out_date::date + INTERVAL '1 day')::timestamp
              ELSE (b.check_out_date::date + b.check_out_time::time)::timestamp
            END)
          AND (params.selected_end_ts +
            (CASE
              WHEN params.selected_end_time = '00:00'
                AND params.selected_end_date = params.selected_start_date
              THEN INTERVAL '1 day'
              ELSE INTERVAL '0'
            END)
          ) > (b.check_in_date::date + b.check_in_time::time)::timestamp
      )
      ORDER BY h.haven_name ASC;
    `;

    const result = await pool.query(query, [checkIn, checkOut]);

    return NextResponse.json({
      success: true,
      data: result.rows as HavenAvailability[],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load available rooms",
      },
      { status: 500 },
    );
  }
};

