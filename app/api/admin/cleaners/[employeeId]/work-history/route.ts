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
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly'; // weekly, monthly, yearly

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      let query = '';
      let dateFormat = '';

      switch (period) {
        case 'weekly':
          query = `
            SELECT 
              DATE_TRUNC('week', created_at) as period,
              COUNT(*) as tasks,
              AVG(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) * 5 as rating
            FROM report_issue
            WHERE user_id = $1
            AND created_at >= NOW() - INTERVAL '12 weeks'
            GROUP BY DATE_TRUNC('week', created_at)
            ORDER BY period DESC
            LIMIT 12
          `;
          dateFormat = 'week';
          break;
        case 'monthly':
          query = `
            SELECT 
              TO_CHAR(created_at, 'Month YYYY') as period,
              COUNT(*) as tasks,
              AVG(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) * 5 as rating
            FROM report_issue
            WHERE user_id = $1
            AND created_at >= NOW() - INTERVAL '12 months'
            GROUP BY TO_CHAR(created_at, 'Month YYYY'), DATE_TRUNC('month', created_at)
            ORDER BY DATE_TRUNC('month', created_at) DESC
            LIMIT 12
          `;
          dateFormat = 'month';
          break;
        case 'yearly':
          query = `
            SELECT 
              TO_CHAR(created_at, 'YYYY') as period,
              COUNT(*) as tasks,
              AVG(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) * 5 as rating
            FROM report_issue
            WHERE user_id = $1
            AND created_at >= NOW() - INTERVAL '5 years'
            GROUP BY TO_CHAR(created_at, 'YYYY')
            ORDER BY period DESC
            LIMIT 5
          `;
          dateFormat = 'year';
          break;
        default:
          query = `
            SELECT 
              TO_CHAR(created_at, 'Month YYYY') as period,
              COUNT(*) as tasks,
              AVG(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) * 5 as rating
            FROM report_issue
            WHERE user_id = $1
            AND created_at >= NOW() - INTERVAL '12 months'
            GROUP BY TO_CHAR(created_at, 'Month YYYY'), DATE_TRUNC('month', created_at)
            ORDER BY DATE_TRUNC('month', created_at) DESC
            LIMIT 12
          `;
      }

      const result = await client.query(query, [employeeId]);

      const workHistory = result.rows.map((row: any) => ({
        period: row.period.trim(),
        tasks: parseInt(row.tasks || '0'),
        rating: parseFloat((row.rating || 0).toFixed(1)),
      }));

      return NextResponse.json({
        success: true,
        data: workHistory,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching work history:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
