import { NextRequest, NextResponse } from 'next/server';
import { sendDownPaymentApprovalEmail } from '@/backend/utils/mailer';

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      guestName,
      bookingId,
      downPaymentAmount,
      roomName,
      remainingBalance,
      propertyAddress
    } = await request.json();

    if (!email || !guestName || !bookingId || !downPaymentAmount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send the down payment approval email
    const emailSent = await sendDownPaymentApprovalEmail(
      email,
      guestName,
      bookingId,
      downPaymentAmount,
      roomName,
      remainingBalance,
      propertyAddress
    );

    if (!emailSent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Down payment approval email sent successfully',
    });
  } catch (error) {
    console.error('Down payment approval email error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
