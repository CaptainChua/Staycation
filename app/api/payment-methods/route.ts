import { NextRequest, NextResponse } from 'next/server';
import pool from '@/backend/config/db';
import { upload_image_from_form } from '@/backend/utils/fileUpload';
import { logActivity } from '@/backend/utils/activityLogger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const client = await pool.connect();
    
    const query = `
      SELECT 
        id,
        payment_name,
        payment_method,
        provider,
        account_details,
        payment_qr_link,
        is_active,
        description,
        created_at,
        updated_at
      FROM payment_methods 
      ORDER BY created_at DESC
    `;
    
    const result = await client.query(query);
    client.release();
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    }

    const client = await pool.connect();
    
    const query = `
      INSERT INTO payment_methods (
        payment_name,
        payment_method,
        provider,
        account_details,
        payment_qr_link,
        description,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
      ) RETURNING *
    `;
    
    const values = [
      payment_name,
      payment_method,
      provider,
      account_details,
      payment_qr_link,
      description || null,
      is_active !== undefined ? is_active : true
    ];
    
    const result = await client.query(query, values);
    client.release();

    // Log activity
    await logActivity({
      employeeId: session.user.id,
      activityType: 'CREATE_PAYMENT_METHOD',
      description: `Created payment method "${payment_name}" (${provider})`,
      entityType: 'payment_method',
      entityId: result.rows[0].id,
      request
    });
    
    return NextResponse.json({
      success: true,
      message: 'Payment method created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create payment method' },
      { status: 500 }
    );
  }
}
