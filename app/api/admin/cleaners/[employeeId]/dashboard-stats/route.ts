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
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Today's Tasks (all reports created today)
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

      // Completed (status = 'Resolved' or 'Closed')
      const completedQuery = `
        SELECT COUNT(*) as count
        FROM report_issue
        WHERE user_id = $1 
        AND status IN ('Resolved', 'Closed')
        AND created_at >= $2 
        AND created_at < $3
      `;
      const completedResult = await client.query(completedQuery, [
        employeeId,
        today.toISOString(),
        tomorrow.toISOString(),
      ]);
      const completed = parseInt(completedResult.rows[0]?.count || '0');

      // In Progress (status = 'In Progress')
      const inProgressQuery = `
        SELECT COUNT(*) as count
        FROM report_issue
        WHERE user_id = $1 
        AND status = 'In Progress'
        AND created_at >= $2 
        AND created_at < $3
      `;
      const inProgressResult = await client.query(inProgressQuery, [
        employeeId,
        today.toISOString(),
        tomorrow.toISOString(),
      ]);
      const inProgress = parseInt(inProgressResult.rows[0]?.count || '0');

      // Pending (status = 'Pending' or 'Open')
      const pendingQuery = `
        SELECT COUNT(*) as count
        FROM report_issue
        WHERE user_id = $1 
        AND status IN ('Pending', 'Open')
        AND created_at >= $2 
        AND created_at < $3
      `;
      const pendingResult = await client.query(pendingQuery, [
        employeeId,
        today.toISOString(),
        tomorrow.toISOString(),
      ]);
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
