import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { logActivity } from "@/backend/utils/activityLogger";
import { createNotificationForUser } from "@/backend/utils/notificationHelper";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { assigned_to } = body;

    if (!assigned_to) {
      return NextResponse.json(
        { success: false, error: "Cleaner ID is required" },
        { status: 400 }
      );
    }

    const cleaningTaskId = params.id;

    // Get current user from session (you'll need to implement this based on your auth system)
    // For now, we'll use a placeholder - you should get this from your NextAuth session
    const currentUserId = req.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000000';

    // Get cleaner and task details for logging and notification
    const taskDetailsQuery = `
      SELECT 
        bc.id::text as cleaning_id,
        b.booking_id,
        b.room_name as haven,
        e.first_name as cleaner_first_name,
        e.last_name as cleaner_last_name
      FROM booking_cleaning bc
      INNER JOIN booking b ON bc.booking_id = b.id
      LEFT JOIN employees e ON e.id = $1::uuid
      WHERE bc.id = $2::uuid
    `;

    const taskDetails = await pool.query(taskDetailsQuery, [assigned_to, cleaningTaskId]);

    if (taskDetails.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cleaning task not found" },
        { status: 404 }
      );
    }

    const task = taskDetails.rows[0];
    const cleanerName = `${task.cleaner_first_name || 'Unknown'} ${task.cleaner_last_name || ''}`.trim();

    // Update only the assigned_to column
    const updateQuery = `
      UPDATE booking_cleaning 
      SET assigned_to = $1, cleaning_status = 'assigned'
      WHERE id = $2::uuid
      RETURNING *
    `;

    const updateResult = await pool.query(updateQuery, [assigned_to, cleaningTaskId]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cleaning task not found" },
        { status: 404 }
      );
    }

    // Log the activity
    await logActivity({
      employeeId: currentUserId,
      activityType: 'ASSIGN_CLEANER',
      description: `Assigned cleaner ${cleanerName} to clean ${task.haven} (Booking: ${task.booking_id})`,
      entityType: 'cleaning_task',
      entityId: cleaningTaskId,
      request: req
    });

    // Create notification for the assigned cleaner
    await createNotificationForUser(assigned_to, {
      title: 'New Cleaning Assignment',
      message: `You have been assigned to clean ${task.haven} for booking ${task.booking_id}. Please check your cleaning tasks.`,
      notificationType: 'cleaning_assignment'
    });

    // Get the updated task with cleaner name
    const selectQuery = `
      SELECT 
        bc.id::text as cleaning_id,
        b.booking_id,
        b.room_name as haven,
        bg.first_name as guest_first_name,
        bg.last_name as guest_last_name,
        bg.email as guest_email,
        bg.phone as guest_phone,
        b.check_in_date,
        b.check_in_time,
        b.check_out_date,
        b.check_out_time,
        bc.cleaning_status,
        bc.assigned_to::text as assigned_cleaner_id,
        e.first_name as cleaner_first_name,
        e.last_name as cleaner_last_name,
        e.employment_id as cleaner_employment_id,
        bc.cleaning_time_in,
        bc.cleaning_time_out,
        bc.cleaned_at,
        bc.inspected_at
      FROM booking_cleaning bc
      INNER JOIN booking b ON bc.booking_id = b.id
      LEFT JOIN booking_guests bg ON bg.booking_id = b.id
      LEFT JOIN employees e ON bc.assigned_to::text = e.id::text
      WHERE bc.id = $1::uuid
      ORDER BY bc.id
      LIMIT 1
    `;

    const selectResult = await pool.query(selectQuery, [cleaningTaskId]);

    console.log("✅ Cleaner assigned successfully:", selectResult.rows[0]);

    return NextResponse.json({
      success: true,
      data: selectResult.rows[0],
      message: "Cleaner assigned successfully",
    });
  } catch (error) {
    console.log("❌ Error assigning cleaner:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to assign cleaner",
      },
      { status: 500 }
    );
  }
}
