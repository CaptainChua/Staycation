import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function ensureNotificationsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        notification_type VARCHAR(50) NOT NULL DEFAULT 'info',
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_notifications_user
          FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
  } finally {
    client.release();
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureNotificationsTable();

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
        n.created_at as created_at,
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
    await ensureNotificationsTable();

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

function formatTimestamp(utcTimestamp: string): string {
  const date = new Date(utcTimestamp);
  const now = new Date();
  
  // Convert both to Manila time (UTC+8) for consistent calculation
  const manilaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const dateManila = new Date(date.getTime() + manilaOffset);
  const nowManila = new Date(now.getTime() + manilaOffset);
  
  const diffInMs = nowManila.getTime() - dateManila.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins} mins ago`;
  if (diffInHours < 24) return `${diffInHours} hrs ago`;
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return dateManila.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: dateManila.getFullYear() !== nowManila.getFullYear() ? 'numeric' : undefined
  });
}

function mapNotificationType(dbType: string): 'info' | 'success' | 'warning' {
  switch (dbType) {
    case 'ReportIssue':
      return 'warning';
    case 'DepositStatus':
      return 'success';
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
