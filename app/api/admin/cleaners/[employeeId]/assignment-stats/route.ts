import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { requireEmployee } from '@/backend/utils/requireAdmin';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayDate = today.toISOString().split('T')[0];

      // Total Assignments (all cleaning tasks assigned to this cleaner)
      const totalQuery = `
        SELECT COUNT(*) as count
        FROM booking_cleaning bc
        INNER JOIN booking b ON bc.booking_id = b.id
        WHERE bc.assigned_to::text = $1
      `;
      const totalResult = await client.query(totalQuery, [employeeId]);
      const total = parseInt(totalResult.rows[0]?.count || '0');

      // Completed (status = 'cleaned' or 'inspected')
      const completedQuery = `
        SELECT COUNT(*) as count
        FROM booking_cleaning bc
        INNER JOIN booking b ON bc.booking_id = b.id
        WHERE bc.assigned_to::text = $1
        AND bc.cleaning_status IN ('cleaned', 'inspected')
      `;
      const completedResult = await client.query(completedQuery, [employeeId]);
      const completed = parseInt(completedResult.rows[0]?.count || '0');

      // In Progress (status = 'in-progress')
      const inProgressQuery = `
        SELECT COUNT(*) as count
        FROM booking_cleaning bc
        INNER JOIN booking b ON bc.booking_id = b.id
        WHERE bc.assigned_to::text = $1
        AND bc.cleaning_status = 'in-progress'
      `;
      const inProgressResult = await client.query(inProgressQuery, [employeeId]);
      const inProgress = parseInt(inProgressResult.rows[0]?.count || '0');

      // Pending (status = 'pending' or 'assigned')
      const pendingQuery = `
        SELECT COUNT(*) as count
        FROM booking_cleaning bc
        INNER JOIN booking b ON bc.booking_id = b.id
        WHERE bc.assigned_to::text = $1
        AND bc.cleaning_status IN ('pending', 'assigned')
      `;
      const pendingResult = await client.query(pendingQuery, [employeeId]);
      const pending = parseInt(pendingResult.rows[0]?.count || '0');

      return NextResponse.json({
        success: true,
        data: {
          total,
          completed,
          inProgress,
          pending,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
