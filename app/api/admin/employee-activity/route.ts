import { NextRequest, NextResponse } from 'next/server';
import pool from '@/backend/config/db';
import { requireEmployee } from '@/backend/utils/requireAdmin';

export async function POST(request: NextRequest) {
  const guard = await requireEmployee();
  if (!guard.ok) return guard.response;
  console.log('🚀 Employee Activity API called');
  
  try {
    const body = await request.json();
    const { employeeId, action, details, entityId, entityType } = body;
    
    console.log('📥 Request body:', { employeeId, action, details, entityId });

    if (!employeeId || !action) {
      console.log('❌ Missing required fields');
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: employeeId, action',
      }, { status: 400 });
    }

    // Get IP address and user agent from request
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    
    console.log('🌐 IP and UserAgent:', { ip, userAgent });

    // Use the database function
    console.log('🗄️ Calling log_employee_activity function');
    const result = await pool.query(
      `SELECT log_employee_activity($1, $2, $3, $4, $5, $6, $7)`,
      [
        employeeId,
        action,
        details || '',
        entityType || null, // entity_type
        entityId || null, // entity_id
        ip,
        userAgent
      ]
    );

    console.log('✅ Employee Activity Logged:', result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Employee activity logged successfully',
    }, { status: 201 });

  } catch (error: any) {
    console.log('❌ Error logging employee activity:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to log employee activity',
    }, { status: 500 });
  }
}
