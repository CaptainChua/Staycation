import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { requireEmployee } from '@/backend/utils/requireAdmin';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface TodayAssignment {
  cleaning_id: string;
  booking_id: string;
  haven: string;
  location: string;
  status: string;
  cleaning_status: string;
  check_out_date: string;
  check_out_time: string;
  cleaning_time_in: string | null;
  cleaning_time_out: string | null;
  cleaned_at: string | null;
  inspected_at: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const guard = await requireEmployee();
  if (!guard.ok) return guard.response;
  try {
    const { employeeId } = await params;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Fetch all assignments for the cleaner (regardless of status or date)
      const query = `
        SELECT
          bc.id::text as cleaning_id,
          b.booking_id,
          b.room_name as haven,
          COALESCE(CONCAT(h.tower, ' - Floor ', h.floor), 'Location TBD') as location,
          bc.cleaning_status,
          b.check_out_date,
          b.check_out_time,
          bc.cleaning_time_in,
          bc.cleaning_time_out,
          bc.cleaned_at,
          bc.inspected_at
        FROM booking_cleaning bc
        INNER JOIN booking b ON bc.booking_id = b.id
        LEFT JOIN havens h ON LOWER(b.room_name) = LOWER(h.haven_name)
        WHERE bc.assigned_to::text = $1
        ORDER BY b.check_out_date DESC, b.check_out_time DESC
      `;

      const result = await client.query(query, [employeeId]);

      return NextResponse.json({
        success: true,
        data: result.rows,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching today assignments:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
