import { NextRequest, NextResponse } from 'next/server';
import pool from '@/backend/config/db';
import { upload_image_from_form } from '@/backend/utils/fileUpload';
import { logActivity } from '@/backend/utils/activityLogger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
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

    const formData = await request.formData();
    
    // Extract form fields
    const payment_name = formData.get('payment_name') as string;
    const payment_method = formData.get('payment_method') as string;
    const provider = formData.get('provider') as string;
    const account_details = formData.get('account_details') as string;
    const description = formData.get('description') as string;
    const is_active = formData.get('is_active') === 'true';
    const qr_image = formData.get('qr_image') as File;
    const remove_qr = formData.get('remove_qr') === 'true';

    // Validate required fields
    if (!payment_name || !payment_method || !provider || !account_details) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    let payment_qr_link = null;
    
    // Handle QR image upload if provided
    if (qr_image && qr_image.size > 0) {
      try {
        const uploadResult = await upload_image_from_form(
          qr_image, 
          'staycation/payment-qr-codes'
        );
        payment_qr_link = uploadResult.url;
      } catch (uploadError) {
        console.error('Error uploading QR image:', uploadError);
        return NextResponse.json(
          { success: false, message: 'Failed to upload QR image' },
          { status: 500 }
        );
      }
    } else if (!remove_qr) {
      // If no new image and not removing, get existing QR link from database
      const client = await pool.connect();
      const existingQuery = 'SELECT payment_qr_link FROM payment_methods WHERE id = $1';
      const existingResult = await client.query(existingQuery, [id]);
      client.release();
      
      if (existingResult.rows.length > 0) {
        payment_qr_link = existingResult.rows[0].payment_qr_link;
      }
    }

    const client = await pool.connect();
    
    const query = `
      UPDATE payment_methods SET
        payment_name = $1,
        payment_method = $2,
        provider = $3,
        account_details = $4,
        payment_qr_link = $5,
        description = $6,
        is_active = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;
    
    const values = [
      payment_name,
      payment_method,
      provider,
      account_details,
      payment_qr_link,
      description || null,
      is_active !== undefined ? is_active : true,
      id
    ];
    
    const result = await client.query(query, values);
    client.release();
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Log activity
    await logActivity({
      employeeId: session.user.id,
      activityType: 'UPDATE_PAYMENT_METHOD',
      description: `Updated payment method "${payment_name}" (${provider})`,
      entityType: 'payment_method',
      entityId: id,
      request
    });
    
    return NextResponse.json({
      success: true,
      message: 'Payment method updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update payment method' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const client = await pool.connect();
    
    // Get payment method details before deletion for logging
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
    
    const query = 'DELETE FROM payment_methods WHERE id = $1 RETURNING *';
    const result = await client.query(query, [id]);
    client.release();
    
    // Log activity
    await logActivity({
      employeeId: session.user.id,
      activityType: 'DELETE_PAYMENT_METHOD',
      description: `Deleted payment method "${paymentMethod.payment_name}" (${paymentMethod.provider})`,
      entityType: 'payment_method',
      entityId: id,
      request
    });
    
    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}
