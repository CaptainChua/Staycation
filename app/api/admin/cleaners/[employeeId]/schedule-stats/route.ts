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
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // This Week: Start of week (Sunday)
      const startOfWeek = new Date(today);
      const dayOfWeek = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      // This Month: Start of month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      // Today's Tasks
      const todaysTasksQuery = `
        SELECT COUNT(*) as count
        FROM report_issue
        WHERE user_id = $1 
        AND created_at >= $2 
        AND created_at < $3
      `;
      const todaysTasksResult = await client.query(todaysTasksQuery, [
        employeeId,
        today.toISOString(),
        tomorrow.toISOString(),
      ]);
      const todaysTasks = parseInt(todaysTasksResult.rows[0]?.count || '0');

      // This Week
      const thisWeekQuery = `
        SELECT COUNT(*) as count
        FROM report_issue
        WHERE user_id = $1 
        AND created_at >= $2 
        AND created_at < $3
      `;
      const thisWeekResult = await client.query(thisWeekQuery, [
        employeeId,
        startOfWeek.toISOString(),
        endOfWeek.toISOString(),
      ]);
      const thisWeek = parseInt(thisWeekResult.rows[0]?.count || '0');

      // This Month
      const thisMonthQuery = `
        SELECT COUNT(*) as count
        FROM report_issue
        WHERE user_id = $1 
        AND created_at >= $2 
        AND created_at < $3
      `;
      const thisMonthResult = await client.query(thisMonthQuery, [
        employeeId,
        startOfMonth.toISOString(),
        startOfNextMonth.toISOString(),
      ]);
      const thisMonth = parseInt(thisMonthResult.rows[0]?.count || '0');

      // Completed (all time)
      const completedQuery = `
        SELECT COUNT(*) as count
        FROM report_issue
        WHERE user_id = $1 
        AND status IN ('Resolved', 'Closed')
      `;
      const completedResult = await client.query(completedQuery, [employeeId]);
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
