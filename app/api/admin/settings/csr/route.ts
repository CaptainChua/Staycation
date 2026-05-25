import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/backend/utils/requireAdmin';

// Mock storage - in production, you'd use a database
let csrSettings: any = {
  notificationPrefs: {
    newBookings: true,
    paymentConfirmations: true,
    checkInNotifications: true,
    checkOutNotifications: true,
    cleaningUpdates: true,
    deliverableUpdates: true,
    guestMessages: true,
    systemAlerts: true,
    emergencyAlerts: true,
    maintenanceAlerts: true,
    lowInventoryAlerts: false,
  },
};

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    return NextResponse.json(csrSettings);
  } catch (error) {
    console.error('Error fetching CSR settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const body = await request.json();
    
    // Validate the settings structure
    const { notificationPrefs } = body;
    
    // Update settings (in production, this would be a database operation)
    if (notificationPrefs) csrSettings.notificationPrefs = { ...csrSettings.notificationPrefs, ...notificationPrefs };

    return NextResponse.json({ 
      message: 'Settings saved successfully',
      settings: csrSettings 
    });
  } catch (error) {
    console.error('Error saving CSR settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
