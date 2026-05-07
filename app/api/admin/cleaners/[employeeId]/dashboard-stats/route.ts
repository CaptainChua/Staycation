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
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Today's Tasks assigned to this cleaner (checkout date = today)
      const todaysTasksResult = await client.query(
        `SELECT COUNT(*) as count
         FROM booking_cleaning bc
         INNER JOIN booking b ON bc.booking_id = b.id
         WHERE bc.assigned_to::text = $1
           AND DATE(b.check_out_date) = $2`,
        [employeeId, todayStr]
      );
      const todaysTasks = parseInt(todaysTasksResult.rows[0]?.count || '0');

      // Completed tasks today (cleaned or inspected)
      const completedResult = await client.query(
        `SELECT COUNT(*) as count
         FROM booking_cleaning bc
         INNER JOIN booking b ON bc.booking_id = b.id
         WHERE bc.assigned_to::text = $1
           AND bc.cleaning_status IN ('cleaned', 'inspected')
           AND DATE(b.check_out_date) = $2`,
        [employeeId, todayStr]
      );
      const completed = parseInt(completedResult.rows[0]?.count || '0');

      // In Progress tasks today
      const inProgressResult = await client.query(
        `SELECT COUNT(*) as count
         FROM booking_cleaning bc
         INNER JOIN booking b ON bc.booking_id = b.id
         WHERE bc.assigned_to::text = $1
           AND bc.cleaning_status = 'in-progress'
           AND DATE(b.check_out_date) = $2`,
        [employeeId, todayStr]
      );
      const inProgress = parseInt(inProgressResult.rows[0]?.count || '0');

      // Pending tasks today (pending or assigned)
      const pendingResult = await client.query(
        `SELECT COUNT(*) as count
         FROM booking_cleaning bc
         INNER JOIN booking b ON bc.booking_id = b.id
         WHERE bc.assigned_to::text = $1
           AND bc.cleaning_status IN ('pending', 'assigned')
           AND DATE(b.check_out_date) = $2`,
        [employeeId, todayStr]
      );
      const pending = parseInt(pendingResult.rows[0]?.count || '0');

      return NextResponse.json({
        success: true,
        data: {
          todaysTasks,
          completed,
          inProgress,
          pending,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
