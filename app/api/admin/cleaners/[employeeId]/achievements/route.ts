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
      // Get recent achievements based on reports
      const achievementsQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE status = 'Resolved') as perfect_weeks,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_tasks,
          COUNT(*) FILTER (WHERE priority_level = 'High' AND status = 'Resolved') as high_priority_completed
        FROM report_issue
        WHERE user_id = $1
      `;
      const achievementsResult = await client.query(achievementsQuery, [employeeId]);
      const stats = achievementsResult.rows[0];

      const achievements = [];

      // Perfect Week achievement
      if (parseInt(stats.perfect_weeks || '0') >= 5) {
        const perfectWeekDate = new Date();
        perfectWeekDate.setDate(perfectWeekDate.getDate() - 7);
        achievements.push({
          title: "Perfect Week",
          description: "Completed all tasks with resolved status",
          date: perfectWeekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          icon: "Award",
        });
      }

      // Speed Demon achievement
      if (parseInt(stats.recent_tasks || '0') >= 10) {
        achievements.push({
          title: "Speed Demon",
          description: "Finished 10+ tasks this week",
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          icon: "Clock",
        });
      }

      // High Priority Master achievement
      if (parseInt(stats.high_priority_completed || '0') >= 5) {
        const highPriorityDate = new Date();
        highPriorityDate.setDate(highPriorityDate.getDate() - 14);
        achievements.push({
          title: "High Priority Master",
          description: "Completed 5+ high priority tasks",
          date: highPriorityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          icon: "Star",
        });
      }

      // Guest Favorite (based on reports with positive feedback)
      const guestFavoriteQuery = `
        SELECT COUNT(*) as count
        FROM report_issue
        WHERE user_id = $1 AND status = 'Resolved'
        AND created_at >= NOW() - INTERVAL '30 days'
      `;
      const guestFavoriteResult = await client.query(guestFavoriteQuery, [employeeId]);
      if (parseInt(guestFavoriteResult.rows[0]?.count || '0') >= 20) {
        achievements.push({
          title: "Guest Favorite",
          description: "Resolved 20+ issues this month",
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          icon: "Star",
        });
      }

      // Sort by date (most recent first) and limit to 3
      achievements.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      return NextResponse.json({
        success: true,
        data: achievements.slice(0, 3),
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching cleaner achievements:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
