import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { requireAdmin } from '@/backend/utils/requireAdmin';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function mapType(activityType: string): string {
  const t = activityType.toUpperCase();
  if (t.includes('LOGIN') || t.includes('LOGOUT') || t.includes('AUTH')) return 'auth';
  if (t.includes('CREATE') || t.includes('ADD') || t.includes('INSERT')) return 'create';
  if (t.includes('UPDATE') || t.includes('EDIT') || t.includes('MODIFY') || t.includes('CHANGE')) return 'update';
  if (t.includes('DELETE') || t.includes('REMOVE')) return 'delete';
  return 'other';
}

function mapSeverity(activityType: string): string {
  const t = activityType.toUpperCase();
  if (t.includes('FAILED') || t.includes('ERROR')) return 'error';
  if (t.includes('DELETE') || t.includes('REMOVE')) return 'critical';
  if (t.includes('UPDATE') || t.includes('MODIFY') || t.includes('CHANGE')) return 'warning';
  return 'info';
}

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    const client = await pool.connect();
    try {
      const allResult = await client.query(
        `SELECT
           l.id,
           l.activity_type,
           l.description,
           l.entity_type,
           l.ip_address,
           l.user_agent,
           (l.created_at AT TIME ZONE 'Asia/Manila') as created_at,
           e.email,
           e.first_name,
           e.last_name,
           e.role
         FROM employee_activity_logs l
         LEFT JOIN employees e ON l.employee_id = e.id
         ORDER BY l.created_at DESC`
      );

      const allLogs = allResult.rows.map(row => ({
        id: row.id,
        action: row.activity_type.replace(/_/g, ' '),
        details: row.description,
        user: row.email || 'Unknown',
        userRole: row.role || 'N/A',
        timestamp: new Date(row.created_at).toLocaleString('en-PH', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }),
        ipAddress: row.ip_address || '—',
        type: mapType(row.activity_type),
        severity: mapSeverity(row.activity_type),
      }));

      const filtered = typeFilter === 'all' ? allLogs : allLogs.filter(l => l.type === typeFilter);
      const total = filtered.length;
      const paginated = filtered.slice(offset, offset + limit);

      return NextResponse.json({ success: true, data: paginated, total });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
