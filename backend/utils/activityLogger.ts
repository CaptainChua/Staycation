import { NextRequest } from 'next/server';
import pool from '../config/db';

interface LogActivityParams {
  employeeId: string;
  activityType: string;
  description: string;
  entityType?: string;
  entityId?: string;
  request?: NextRequest;
}

export const logActivity = async ({
  employeeId,
  activityType,
  description,
  entityType = 'payment_method',
  entityId,
  request
}: LogActivityParams): Promise<void> => {
  try {
    let ipAddress = null;
    let userAgent = null;

    // Extract IP and User Agent from request if available
    if (request) {
      ipAddress = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 '127.0.0.1';
      userAgent = request.headers.get('user-agent') || 'Unknown';
    }

    const query = `
      SELECT log_employee_activity(
        $1::UUID,
        $2,
        $3,
        $4,
        $5::UUID,
        $6::INET,
        $7
      )
    `;

    const values = [
      employeeId,
      activityType,
      description,
      entityType,
      entityId || null,
      ipAddress,
      userAgent
    ];

    await pool.query(query, values);
    console.log(`✅ Activity logged: ${activityType} - ${description}`);
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    // Don't throw error to avoid breaking main functionality
  }
};
