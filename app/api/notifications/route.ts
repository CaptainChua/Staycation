import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    // Verify authentication using NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = `
      SELECT 
        n.notification_id,
        n.title,
        n.message,
        n.notification_type,
        n.is_read,
        (n.created_at AT TIME ZONE 'Asia/Manila') as created_at,
        e.first_name,
        e.last_name,
        e.email
      FROM notifications n
      JOIN employees e ON n.user_id = e.id
      WHERE n.user_id = $1
    `;

    const params: (string | number)[] = [userId];

    if (unreadOnly) {
      query += ' AND n.is_read = FALSE';
    }

    query += ' ORDER BY n.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Transform the data to match the expected format
    const notifications = result.rows.map(row => ({
      id: row.notification_id,
      title: row.title,
      description: row.message,
      timestamp: formatTimestamp(row.created_at),
      type: mapNotificationType(row.notification_type),
      read: row.is_read,
      user: {
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email
      }
    }));

    return NextResponse.json({
      success: true,
      data: notifications,
      total: notifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication using NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await request.json();
    const { notificationIds, markAs } = body;

    if (!notificationIds || !Array.isArray(notificationIds) || !markAs) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Update notifications
    const query = `
      UPDATE notifications 
      SET is_read = $1 
      WHERE notification_id = ANY($2) 
      AND user_id = $3
    `;

    await pool.query(query, [markAs === 'read', notificationIds, userId]);

    return NextResponse.json({
      success: true,
      message: `Notifications marked as ${markAs}`
    });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

function formatTimestamp(timestamp: string): string {
  // The timestamp is already converted to Manila time by the database query
  const date = new Date(timestamp);
  const now = new Date();
  
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins} mins ago`;
  if (diffInHours < 24) return `${diffInHours} hrs ago`;
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function mapNotificationType(dbType: string): 'info' | 'success' | 'warning' {
  switch (dbType) {
    case 'ReportIssue':
      return 'warning';
    case 'StatusUpdate':
      return 'info';
    case 'System':
      return 'info';
    case 'Booking':
      return 'success';
    case 'Payment':
      return 'success';
    default:
      return 'info';
  }
}
