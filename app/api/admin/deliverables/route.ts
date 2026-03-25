import { NextRequest, NextResponse } from 'next/server';
import { getDeliverables } from '@/app/admin/csr/actions';
import { updateDeliverableStatus, markDeliverableDelivered, cancelDeliverable, refundDeliverable } from '@/app/admin/csr/actions';

export async function GET(request: NextRequest) {
  try {
    const deliverables = await getDeliverables();
    return NextResponse.json({
      success: true,
      data: deliverables
    });
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch deliverables',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { deliverableId, newStatus } = await request.json();
    
    if (!deliverableId || !newStatus) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await updateDeliverableStatus(deliverableId, newStatus);
    
    return NextResponse.json({
      success: true,
      message: `Deliverable marked as ${newStatus}`
    });
  } catch (error) {
    console.error('Error updating deliverable:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update deliverable',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { deliverableId, action } = await request.json();
    
    if (!deliverableId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'delivered':
        await markDeliverableDelivered(deliverableId);
        break;
      case 'cancelled':
        await cancelDeliverable(deliverableId);
        break;
      case 'refunded':
        await refundDeliverable(deliverableId);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      message: `Deliverable ${action} successfully`
    });
  } catch (error) {
    console.error('Error performing deliverable action:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
