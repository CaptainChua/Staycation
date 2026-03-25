import { NextRequest, NextResponse } from 'next/server';
import pool from '@/backend/config/db';
import { logActivity } from '@/backend/utils/activityLogger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { is_active } = body;

    if (is_active === undefined) {
      return NextResponse.json(
        { success: false, message: 'is_active field is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    // Get payment method details before update for logging
    const getQuery = 'SELECT payment_name, provider FROM payment_methods WHERE id = $1';
    const getResult = await client.query(getQuery, [id]);
    
    if (getResult.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { success: false, message: 'Payment method not found' },
        { status: 404 }
      );
    }

    const paymentMethod = getResult.rows[0];
    
    const query = `
      UPDATE payment_methods SET
        is_active = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await client.query(query, [is_active, id]);
    client.release();
    
    // Log activity
    await logActivity({
      employeeId: session.user.id,
      activityType: is_active ? 'ACTIVATE_PAYMENT_METHOD' : 'DEACTIVATE_PAYMENT_METHOD',
      description: `${is_active ? 'Activated' : 'Deactivated'} payment method "${paymentMethod.payment_name}" (${paymentMethod.provider})`,
      entityType: 'payment_method',
      entityId: id,
      request
    });
    
    return NextResponse.json({
      success: true,
      message: `Payment method ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error toggling payment method status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update payment method status' },
      { status: 500 }
    );
  }
}
