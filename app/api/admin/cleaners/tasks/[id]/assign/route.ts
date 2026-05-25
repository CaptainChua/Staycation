import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { logActivity } from "@/backend/utils/activityLogger";
import { createNotificationForUser } from "@/backend/utils/notificationHelper";
import { requireEmployee } from "@/backend/utils/requireAdmin";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireEmployee();
  if (!guard.ok) return guard.response;
  try {
    const { id: cleaningTaskId } = await params;
    const body = await req.json();
    const { assigned_to } = body;

    if (!assigned_to) {
      return NextResponse.json(
        { success: false, error: "Cleaner ID is required" },
        { status: 400 }
      );
    }

    const currentUserId = (guard.session.user as { id?: string })?.id ?? '00000000-0000-0000-0000-000000000000';

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

    // --- TIME CONFLICT CHECK ---
    // Block the assignment if the cleaner already has another active task
    // whose check-in/check-out window overlaps with this booking. Treat
    // '00:00' checkout as end-of-day midnight (start of next day).
    const conflictResult = await pool.query(
      `
      SELECT
        b2.booking_id AS conflicting_booking_id,
        b2.room_name  AS conflicting_haven,
        b2.check_in_date  AS c_in_date,
        b2.check_in_time  AS c_in_time,
        b2.check_out_date AS c_out_date,
        b2.check_out_time AS c_out_time
      FROM booking_cleaning bc_existing
      JOIN booking b_target ON b_target.id = (
        SELECT booking_id FROM booking_cleaning WHERE id = $1::uuid LIMIT 1
      )
      JOIN booking b2 ON b2.id = bc_existing.booking_id
      WHERE bc_existing.assigned_to = $2::uuid
        AND bc_existing.id <> $1::uuid
        AND b2.status NOT IN ('rejected', 'cancelled', 'declined')
        AND (b2.check_in_date::DATE + COALESCE(b2.check_in_time::TIME, '00:00'::TIME)) <
            CASE WHEN b_target.check_out_time = '00:00'
                 THEN (b_target.check_out_date::DATE + INTERVAL '1 day')::TIMESTAMP
                 ELSE (b_target.check_out_date::DATE + b_target.check_out_time::TIME)::TIMESTAMP
            END
        AND (
            CASE WHEN b2.check_out_time = '00:00'
                 THEN (b2.check_out_date::DATE + INTERVAL '1 day')::TIMESTAMP
                 ELSE (b2.check_out_date::DATE + b2.check_out_time::TIME)::TIMESTAMP
            END
        ) > (b_target.check_in_date::DATE + COALESCE(b_target.check_in_time::TIME, '00:00'::TIME))::TIMESTAMP
      LIMIT 1
      `,
      [cleaningTaskId, assigned_to]
    );

    if (conflictResult.rows.length > 0) {
      const c = conflictResult.rows[0];
      const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const fmtTime = (t: string | null) => {
        if (!t) return "";
        const [h, m] = t.substring(0, 5).split(":").map(Number);
        const period = h >= 12 ? "PM" : "AM";
        const hr = h % 12 || 12;
        return ` ${hr}:${String(m).padStart(2, "0")} ${period}`;
      };
      const windowStr = `${fmtDate(c.c_in_date)}${fmtTime(c.c_in_time)} → ${fmtDate(c.c_out_date)}${fmtTime(c.c_out_time)}`;
      return NextResponse.json(
        {
          success: false,
          error: `${cleanerName} is already assigned to ${c.conflicting_haven} (Booking: ${c.conflicting_booking_id}) during ${windowStr}. Please pick another cleaner or reschedule.`,
        },
        { status: 409 }
      );
    }
    // --- END CONFLICT CHECK ---

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
