import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
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
      const now = new Date();

      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Start of week (Sunday)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfWeekStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      const endOfWeekStr = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`;

      // Start/end of month
      const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const startOfNextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

      // Today's Tasks
      const todaysTasksResult = await client.query(
        `SELECT COUNT(*) as count
         FROM booking_cleaning bc
         INNER JOIN booking b ON bc.booking_id = b.id
         WHERE bc.assigned_to::text = $1
           AND DATE(b.check_out_date) = $2`,
        [employeeId, todayStr]
      );
      const todaysTasks = parseInt(todaysTasksResult.rows[0]?.count || '0');

      // This Week
      const thisWeekResult = await client.query(
        `SELECT COUNT(*) as count
         FROM booking_cleaning bc
         INNER JOIN booking b ON bc.booking_id = b.id
         WHERE bc.assigned_to::text = $1
           AND DATE(b.check_out_date) >= $2
           AND DATE(b.check_out_date) < $3`,
        [employeeId, startOfWeekStr, endOfWeekStr]
      );
      const thisWeek = parseInt(thisWeekResult.rows[0]?.count || '0');

      // This Month
      const thisMonthResult = await client.query(
        `SELECT COUNT(*) as count
         FROM booking_cleaning bc
         INNER JOIN booking b ON bc.booking_id = b.id
         WHERE bc.assigned_to::text = $1
           AND DATE(b.check_out_date) >= $2
           AND DATE(b.check_out_date) < $3`,
        [employeeId, startOfMonthStr, startOfNextMonthStr]
      );
      const thisMonth = parseInt(thisMonthResult.rows[0]?.count || '0');

      // Completed (all time)
      const completedResult = await client.query(
        `SELECT COUNT(*) as count
         FROM booking_cleaning bc
         WHERE bc.assigned_to::text = $1
           AND bc.cleaning_status IN ('cleaned', 'inspected')`,
        [employeeId]
      );
      const completed = parseInt(completedResult.rows[0]?.count || '0');

      return NextResponse.json({
        success: true,
        data: {
          todaysTasks,
          thisWeek,
          thisMonth,
          completed,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching schedule stats:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
