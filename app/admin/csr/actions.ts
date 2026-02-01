'use server';

import pool from "@/backend/config/db";
import { headers } from "next/headers";
import { createNotificationsForRoles } from "@/backend/utils/notificationHelper";

export interface DepositRecord {
  id: string; // UUID from booking_security_deposits
  deposit_id: string; // Formatted display ID (DP-XXX)
  booking_id: string; // booking.booking_id (varchar)
  booking_uuid: string; // booking.id (UUID)
  guest: string;
  guest_email: string | null;
  guest_phone: string | null;
  guest_facebook_link: string | null;
  guest_valid_id_url: string | null;
  haven: string;
  tower: string;
  deposit_amount: number;
  formatted_amount: string;
  refunded_amount: number;
  forfeited_amount: number;
  status: string; // 'pending' | 'held' | 'returned' | 'partial' | 'forfeited'
  payment_method: string | null;
  payment_proof_url: string | null;
  checkin_date: string;
  checkin_date_raw: Date;
  checkout_date: string;
  checkout_date_raw: Date;
  held_at: Date | null;
  returned_at: Date | null;
  notes: string | null;
}

export async function getDeposits(): Promise<DepositRecord[]> {
  const client = await pool.connect();
  try {
    const query = `
      SELECT
        sd.id,
        sd.booking_id as booking_uuid,
        sd.amount,
        sd.deposit_status,
        sd.refunded_amount,
        sd.forfeited_amount,
        sd.payment_method,
        sd.payment_proof_url,
        sd.held_at,
        sd.returned_at,
        sd.notes,
        b.booking_id,
        b.room_name,
        b.check_in_date,
        b.check_in_time,
        b.check_out_date,
        b.check_out_time,
        bg.first_name,
        bg.last_name,
        bg.email,
        bg.phone,
        bg.facebook_link,
        bg.valid_id_url,
        h.tower
      FROM booking_security_deposits sd
      INNER JOIN booking b ON sd.booking_id = b.id
      LEFT JOIN LATERAL (
        SELECT first_name, last_name, email, phone, facebook_link, valid_id_url
        FROM booking_guests
        WHERE booking_id = b.id
        LIMIT 1
      ) bg ON true
      LEFT JOIN havens h ON b.room_name = h.haven_name
      ORDER BY b.check_out_date DESC, sd.held_at DESC
    `;

    const result = await client.query(query);

    return result.rows.map((row: any) => {
      // Format Amount
      const amount = parseFloat(row.amount) || 0;
      const formattedAmount = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0
      }).format(amount);

      // Format Dates
      const checkinDate = row.check_in_date ? new Date(row.check_in_date) : new Date();
      const formattedCheckinDate = checkinDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) + (row.check_in_time ? ` ${row.check_in_time}` : '');
      
      const checkoutDate = row.check_out_date ? new Date(row.check_out_date) : new Date();
      const formattedCheckoutDate = checkoutDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) + (row.check_out_time ? ` ${row.check_out_time}` : '');

      // Format Tower
      let towerDisplay = row.tower || 'Unknown';
      if (towerDisplay !== 'Unknown') {
        towerDisplay = towerDisplay
          .split('-')
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }

      // Format Haven Name
      const havenDisplay = row.room_name ? row.room_name.replace(/Room/i, 'Haven') : 'Unknown Haven';

      // Map deposit_status to UI display status
      const statusMap: Record<string, string> = {
        'pending': 'Pending',
        'held': 'Held',
        'returned': 'Returned',
        'partial': 'Partial',
        'forfeited': 'Forfeited'
      };

      // Generate short display ID from UUID (first 8 chars)
      const shortId = row.id.substring(0, 8).toUpperCase();

      return {
        id: row.id,
        deposit_id: `DP-${shortId}`,
        booking_id: row.booking_id,
        booking_uuid: row.booking_uuid,
        guest: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown Guest',
        guest_email: row.email,
        guest_phone: row.phone,
        guest_facebook_link: row.facebook_link,
        guest_valid_id_url: row.valid_id_url,
        haven: havenDisplay,
        tower: towerDisplay,
        deposit_amount: amount,
        formatted_amount: formattedAmount,
        refunded_amount: parseFloat(row.refunded_amount) || 0,
        forfeited_amount: parseFloat(row.forfeited_amount) || 0,
        status: statusMap[row.deposit_status] || 'Pending',
        payment_method: row.payment_method,
        payment_proof_url: row.payment_proof_url,
        checkin_date: formattedCheckinDate,
        checkin_date_raw: checkinDate,
        checkout_date: formattedCheckoutDate,
        checkout_date_raw: checkoutDate,
        held_at: row.held_at,
        returned_at: row.returned_at,
        notes: row.notes
      };
    });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    throw new Error('Failed to fetch deposits');
  } finally {
    client.release();
  }
}

// Default security deposit amount
const DEFAULT_SECURITY_DEPOSIT_AMOUNT = 1000;

// Update deposit status in booking_security_deposits table
export async function updateDepositStatus(
  depositId: string,
  newStatus: string,
  employeeId?: string,
  notes?: string,
  paymentMethod?: string,
  paymentProofUrl?: string
): Promise<void> {
  const client = await pool.connect();
  try {
    // Get IP address and user agent from headers
    const requestHeaders = await headers();
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || 'unknown';
    const userAgent = requestHeaders.get('user-agent') || 'unknown';
    // Map UI status to database deposit_status values
    const statusMap: Record<string, string> = {
      'Pending': 'pending',
      'Held': 'held',
      'Returned': 'returned',
      'Partial': 'partial',
      'Forfeited': 'forfeited'
    };

    const dbStatus = statusMap[newStatus] || newStatus.toLowerCase();
    const now = new Date();

    // Update status and set returned_at if marking as returned
    if (dbStatus === 'returned') {
      await client.query(
        `UPDATE booking_security_deposits
         SET deposit_status = $2, returned_at = $3, processed_by = $4, notes = COALESCE($5, notes)
         WHERE id = $1`,
        [depositId, dbStatus, now, employeeId, notes]
      );
    } else if (dbStatus === 'held') {
      // When marking as held (paid), also set the amount, payment method, proof URL, and held_at
      await client.query(
        `UPDATE booking_security_deposits
         SET deposit_status = $2,
             amount = $3,
             payment_method = COALESCE($4, payment_method),
             payment_proof_url = COALESCE($5, payment_proof_url),
             held_at = $6,
             processed_by = $7,
             notes = COALESCE($8, notes)
         WHERE id = $1`,
        [depositId, dbStatus, DEFAULT_SECURITY_DEPOSIT_AMOUNT, paymentMethod, paymentProofUrl, now, employeeId, notes]
      );
    } else {
      await client.query(
        `UPDATE booking_security_deposits
         SET deposit_status = $2, processed_by = $3, notes = COALESCE($4, notes)
         WHERE id = $1`,
        [depositId, dbStatus, employeeId, notes]
      );
    }

    // Log activity if employeeId is provided
    if (employeeId) {
      await client.query(
        `SELECT log_employee_activity($1, $2, $3, $4, $5, $6, $7)`,
        [
          employeeId,
          'UPDATE_DEPOSIT_STATUS',
          `Updated deposit status to ${newStatus}${notes ? ` - Notes: ${notes}` : ''}`,
          'deposit',
          depositId,
          ipAddress,
          userAgent
        ]
      );
    }

    // Create notifications for Owner and CSR roles
    try {
      // Get deposit details for notification
      const depositQuery = `
        SELECT 
          sd.id,
          b.booking_id,
          bg.first_name,
          bg.last_name,
          sd.amount,
          sd.deposit_status
        FROM booking_security_deposits sd
        INNER JOIN booking b ON sd.booking_id = b.id
        LEFT JOIN booking_guests bg ON b.id = bg.booking_id
        WHERE sd.id = $1
      `;
      
      const depositResult = await client.query(depositQuery, [depositId]);
      const deposit = depositResult.rows[0];
      
      if (deposit) {
        const guestName = `${deposit.first_name || ''} ${deposit.last_name || ''}`.trim() || 'Unknown Guest';
        const amount = parseFloat(deposit.amount) || 0;
        const formattedAmount = new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
          minimumFractionDigits: 0
        }).format(amount);
        
        // Create notification message based on status
        let notificationTitle = '';
        let notificationMessage = '';
        
        switch (newStatus) {
          case 'Held':
            notificationTitle = 'Security Deposit Held';
            notificationMessage = `Security deposit of ${formattedAmount} for ${guestName} (Booking: ${deposit.booking_id}) has been held.`;
            break;
          case 'Returned':
            notificationTitle = 'Security Deposit Returned';
            notificationMessage = `Security deposit of ${formattedAmount} for ${guestName} (Booking: ${deposit.booking_id}) has been returned.`;
            break;
          case 'Partial':
            notificationTitle = 'Security Deposit Partially Refunded';
            notificationMessage = `Partial refund processed for security deposit of ${guestName} (Booking: ${deposit.booking_id}).${notes ? ` Reason: ${notes}` : ''}`;
            break;
          case 'Forfeited':
            notificationTitle = 'Security Deposit Forfeited';
            notificationMessage = `Security deposit of ${formattedAmount} for ${guestName} (Booking: ${deposit.booking_id}) has been forfeited.${notes ? ` Reason: ${notes}` : ''}`;
            break;
          default:
            notificationTitle = 'Security Deposit Status Updated';
            notificationMessage = `Security deposit status for ${guestName} (Booking: ${deposit.booking_id}) updated to ${newStatus}.`;
        }
        
        // Create notifications for Owner and CSR roles
        await createNotificationsForRoles(['Owner', 'CSR'], {
          title: notificationTitle,
          message: notificationMessage,
          notificationType: 'DepositStatus'
        });
        
        console.log(`✅ Notifications created for deposit status update: ${newStatus}`);
      }
    } catch (notificationError) {
      console.error('Failed to create deposit status notifications:', notificationError);
      // Don't throw error here as the main operation succeeded
    }
  } catch (error) {
    console.error("Error updating deposit status:", error);
    throw new Error("Failed to update deposit status");
  } finally {
    client.release();
  }
}

// Test function to check database connection
export async function testDatabaseConnection(): Promise<string> {
  console.log('Testing database connection...');
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Database connection successful:', result.rows[0]);
    return `Database connection successful: ${result.rows[0].current_time}`;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error('Database connection failed');
  } finally {
    client.release();
  }
}

// Process partial refund
export async function processPartialRefund(
  depositId: string,
  refundAmount: number,
  deductionReason: string,
  employeeId?: string
): Promise<void> {
  console.log('processPartialRefund called with:', {
    depositId,
    refundAmount,
    deductionReason,
    employeeId
  });

  const client = await pool.connect();
  try {
    // Get IP address and user agent from headers
    const requestHeaders = await headers();
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || 'unknown';
    const userAgent = requestHeaders.get('user-agent') || 'unknown';
    
    const now = new Date();

    // Get the current deposit amount
    console.log('Fetching deposit amount for:', depositId);
    const result = await client.query(
      `SELECT amount FROM booking_security_deposits WHERE id = $1`,
      [depositId]
    );

    if (result.rows.length === 0) {
      console.error('Deposit not found for ID:', depositId);
      throw new Error('Deposit not found');
    }

    console.log('Found deposit amount:', result.rows[0].amount);
    const totalAmount = parseFloat(result.rows[0].amount);
    const forfeitedAmount = totalAmount - refundAmount;

    console.log('Updating deposit with:', {
      depositId,
      refundAmount,
      forfeitedAmount,
      totalAmount,
      employeeId,
      deductionReason
    });

    await client.query(
      `UPDATE booking_security_deposits
       SET deposit_status = 'partial',
           refunded_amount = $2,
           forfeited_amount = $3,
           returned_at = $4,
           processed_by = $5,
           notes = $6
       WHERE id = $1`,
      [depositId, refundAmount, forfeitedAmount, now, employeeId, deductionReason]
    );

    console.log('Deposit updated successfully');

    // Log activity if employeeId is provided
    if (employeeId) {
      console.log('Logging employee activity...');
      try {
        await client.query(
          `SELECT log_employee_activity($1, $2, $3, $4, $5, $6, $7)`,
          [
            employeeId,
            'PROCESS_PARTIAL_REFUND',
            `Processed partial refund of ₱${refundAmount.toFixed(2)} with deduction reason: ${deductionReason}`,
            'deposit',
            depositId,
            ipAddress,
            userAgent
          ]
        );
        console.log('Employee activity logged successfully');
      } catch (logError) {
        console.error('Failed to log employee activity:', logError);
        // Continue without failing the main operation
      }
    }

    // Create notifications for Owner and CSR roles
    try {
      // Get deposit details for notification
      const depositQuery = `
        SELECT 
          sd.id,
          b.booking_id,
          bg.first_name,
          bg.last_name,
          sd.amount
        FROM booking_security_deposits sd
        INNER JOIN booking b ON sd.booking_id = b.id
        LEFT JOIN booking_guests bg ON b.id = bg.booking_id
        WHERE sd.id = $1
      `;
      
      const depositResult = await client.query(depositQuery, [depositId]);
      const deposit = depositResult.rows[0];
      
      if (deposit) {
        const guestName = `${deposit.first_name || ''} ${deposit.last_name || ''}`.trim() || 'Unknown Guest';
        const totalAmount = parseFloat(deposit.amount) || 0;
        const formattedRefundAmount = new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
          minimumFractionDigits: 0
        }).format(refundAmount);
        
        // Create notifications for Owner and CSR roles
        await createNotificationsForRoles(['Owner', 'CSR'], {
          title: 'Security Deposit Partially Refunded',
          message: `Partial refund of ${formattedRefundAmount} processed for ${guestName} (Booking: ${deposit.booking_id}). Reason: ${deductionReason}`,
          notificationType: 'DepositStatus'
        });
        
        console.log(`✅ Notifications created for partial refund`);
      }
    } catch (notificationError) {
      console.error('Failed to create partial refund notifications:', notificationError);
      // Don't throw error here as the main operation succeeded
    }
  } catch (error) {
    console.error("Error processing partial refund:", error);
    console.error("Error details:", {
      depositId,
      refundAmount,
      deductionReason,
      employeeId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    });
    throw new Error("Failed to process partial refund");
  } finally {
    client.release();
  }
}
// Process forfeiture
export async function processForfeiture(
  depositId: string,
  forfeitureReason: string,
  employeeId?: string
): Promise<void> {
  const client = await pool.connect();
  try {
    // Get IP address and user agent from headers
    const requestHeaders = await headers();
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || 'unknown';
    const userAgent = requestHeaders.get('user-agent') || 'unknown';
    
    // Get the current deposit amount
    const result = await client.query(
      `SELECT amount FROM booking_security_deposits WHERE id = $1`,
      [depositId]
    );

    if (result.rows.length === 0) {
      throw new Error('Deposit not found');
    }

    const totalAmount = parseFloat(result.rows[0].amount);

    await client.query(
      `UPDATE booking_security_deposits
       SET deposit_status = 'forfeited',
           refunded_amount = 0,
           forfeited_amount = $2,
           processed_by = $3,
           notes = $4
       WHERE id = $1`,
      [depositId, totalAmount, employeeId, forfeitureReason]
    );

    // Log activity if employeeId is provided
    if (employeeId) {
      await client.query(
        `SELECT log_employee_activity($1, $2, $3, $4, $5, $6, $7)`,
        [
          employeeId,
          'PROCESS_FORFEITURE',
          `Processed forfeiture of ₱${totalAmount.toFixed(2)} with reason: ${forfeitureReason}`,
          'deposit',
          depositId,
          ipAddress,
          userAgent
        ]
      );
    }

    // Create notifications for Owner and CSR roles
    try {
      // Get deposit details for notification
      const depositQuery = `
        SELECT 
          sd.id,
          b.booking_id,
          bg.first_name,
          bg.last_name,
          sd.amount
        FROM booking_security_deposits sd
        INNER JOIN booking b ON sd.booking_id = b.id
        LEFT JOIN booking_guests bg ON b.id = bg.booking_id
        WHERE sd.id = $1
      `;
      
      const depositResult = await client.query(depositQuery, [depositId]);
      const deposit = depositResult.rows[0];
      
      if (deposit) {
        const guestName = `${deposit.first_name || ''} ${deposit.last_name || ''}`.trim() || 'Unknown Guest';
        const formattedAmount = new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
          minimumFractionDigits: 0
        }).format(totalAmount);
        
        // Create notifications for Owner and CSR roles
        await createNotificationsForRoles(['Owner', 'CSR'], {
          title: 'Security Deposit Forfeited',
          message: `Security deposit of ${formattedAmount} for ${guestName} (Booking: ${deposit.booking_id}) has been forfeited. Reason: ${forfeitureReason}`,
          notificationType: 'DepositStatus'
        });
        
        console.log(`✅ Notifications created for forfeiture`);
      }
    } catch (notificationError) {
      console.error('Failed to create forfeiture notifications:', notificationError);
      // Don't throw error here as the main operation succeeded
    }
  } catch (error) {
    console.error("Error processing forfeiture:", error);
    throw new Error("Failed to process forfeiture");
  } finally {
    client.release();
  }
}

// Process full refund
export async function processFullRefund(
  depositId: string,
  amount: number = 0,
  employeeId?: string
): Promise<void> {
  const client = await pool.connect();
  try {
    // Get IP address and user agent from headers
    const requestHeaders = await headers();
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || 'unknown';
    const userAgent = requestHeaders.get('user-agent') || 'unknown';
    
    const now = new Date();

    // Get the current deposit amount
    const result = await client.query(
      `SELECT amount FROM booking_security_deposits WHERE id = $1`,
      [depositId]
    );

    if (result.rows.length === 0) {
      throw new Error('Deposit not found');
    }

    const totalAmount = parseFloat(result.rows[0].amount);

    await client.query(
      `UPDATE booking_security_deposits
       SET deposit_status = 'returned',
           refunded_amount = $2,
           forfeited_amount = 0,
           returned_at = $3,
           processed_by = $4
       WHERE id = $1`,
      [depositId, totalAmount, now, employeeId]
    );

    // Log activity if employeeId is provided
    if (employeeId) {
      await client.query(
        `SELECT log_employee_activity($1, $2, $3, $4, $5, $6, $7)`,
        [
          employeeId,
          'PROCESS_FULL_REFUND',
          `Processed full refund of ₱${totalAmount.toFixed(2)}`,
          'deposit',
          depositId,
          ipAddress,
          userAgent
        ]
      );
    }

    // Create notifications for Owner and CSR roles
    try {
      // Get deposit details for notification
      const depositQuery = `
        SELECT 
          sd.id,
          b.booking_id,
          bg.first_name,
          bg.last_name,
          sd.amount
        FROM booking_security_deposits sd
        INNER JOIN booking b ON sd.booking_id = b.id
        LEFT JOIN booking_guests bg ON b.id = bg.booking_id
        WHERE sd.id = $1
      `;
      
      const depositResult = await client.query(depositQuery, [depositId]);
      const deposit = depositResult.rows[0];
      
      if (deposit) {
        const guestName = `${deposit.first_name || ''} ${deposit.last_name || ''}`.trim() || 'Unknown Guest';
        const formattedAmount = new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
          minimumFractionDigits: 0
        }).format(totalAmount);
        
        // Create notifications for Owner and CSR roles
        await createNotificationsForRoles(['Owner', 'CSR'], {
          title: 'Security Deposit Fully Refunded',
          message: `Security deposit of ${formattedAmount} for ${guestName} (Booking: ${deposit.booking_id}) has been fully refunded.`,
          notificationType: 'DepositStatus'
        });
        
        console.log(`✅ Notifications created for full refund`);
      }
    } catch (notificationError) {
      console.error('Failed to create full refund notifications:', notificationError);
      // Don't throw error here as the main operation succeeded
    }
  } catch (error) {
    console.error("Error processing full refund:", error);
    throw new Error("Failed to process full refund");
  } finally {
    client.release();
  }
}

// Refund deposit (full or partial)
export async function refundDeposit(
  depositId: string,
  refundAmount: number,
  notes?: string
): Promise<void> {
  const client = await pool.connect();
  try {
    const now = new Date();

    // Get the current deposit amount
    const result = await client.query(
      `SELECT amount, refunded_amount FROM booking_security_deposits WHERE id = $1`,
      [depositId]
    );

    if (result.rows.length === 0) {
      throw new Error('Deposit not found');
    }

    const deposit = result.rows[0];
    const totalAmount = parseFloat(deposit.amount);
    const currentRefunded = parseFloat(deposit.refunded_amount) || 0;
    const newRefundedTotal = currentRefunded + refundAmount;

    // Determine status based on refund amount
    let newStatus = 'partial';
    if (newRefundedTotal >= totalAmount) {
      newStatus = 'returned';
    }

    await client.query(
      `UPDATE booking_security_deposits
       SET deposit_status = $2,
           refunded_amount = $3,
           returned_at = $4,
           notes = COALESCE($5, notes)
       WHERE id = $1`,
      [depositId, newStatus, newRefundedTotal, now, notes]
    );
  } catch (error) {
    console.error("Error refunding deposit:", error);
    throw new Error("Failed to refund deposit");
  } finally {
    client.release();
  }
}

// Forfeit deposit (full or partial)
export async function forfeitDeposit(
  depositId: string,
  forfeitAmount: number,
  reason?: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE booking_security_deposits
       SET deposit_status = 'forfeited',
           forfeited_amount = $2,
           notes = COALESCE($3, notes)
       WHERE id = $1`,
      [depositId, forfeitAmount, reason]
    );
  } catch (error) {
    console.error("Error forfeiting deposit:", error);
    throw new Error("Failed to forfeit deposit");
  } finally {
    client.release();
  }
}

// Delete deposit record
export async function deleteDeposit(depositId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `DELETE FROM booking_security_deposits WHERE id = $1`,
      [depositId]
    );
  } catch (error) {
    console.error("Error deleting deposit:", error);
    throw new Error("Failed to delete deposit");
  } finally {
    client.release();
  }
}

// ==================== DELIVERABLES (ADD-ONS) ====================

// Individual item within a deliverable record
export interface DeliverableItem {
  id: string; // UUID from booking_add_ons
  name: string;
  price: number;
  quantity: number;
  total_price: number;
  formatted_price: string;
  formatted_total: string;
  status: string;
  delivered_at: Date | null;
  handled_by: string | null;
  notes: string | null;
}

// Grouped deliverable record by booking
export interface DeliverableRecord {
  id: string; // booking_uuid (used as group key)
  deliverable_id: string; // Formatted display ID (DL-XXX based on booking)
  booking_id: string; // booking.booking_id (varchar)
  booking_uuid: string; // booking.id (UUID)
  guest: string;
  guest_email: string | null;
  guest_phone: string | null;
  haven: string;
  tower: string;
  items: DeliverableItem[]; // Array of items for this booking
  grand_total: number; // Sum of all item totals
  formatted_grand_total: string;
  overall_status: string; // Aggregated status for the booking
  checkin_date: string;
  checkin_date_raw: Date;
  checkout_date: string;
  checkout_date_raw: Date;
  created_at: Date;
  // Payment information
  payment_status: string | null; // 'pending' | 'approved' | 'rejected' | 'refunded'
  payment_type: 'full' | 'down_payment' | 'unpaid'; // Type of payment
  total_amount: number;
  down_payment: number;
  remaining_balance: number;
  formatted_total_amount: string;
  formatted_down_payment: string;
  formatted_remaining_balance: string;
  payment_proof_url: string | null;
  // Security deposit information
  security_deposit_id: string | null;
  security_deposit_amount: number;
  formatted_security_deposit_amount: string;
  security_deposit_status: string | null;
  security_deposit_refunded_amount: number;
  security_deposit_forfeited_amount: number;
  security_deposit_payment_method: string | null;
  security_deposit_payment_proof_url: string | null;
  security_deposit_held_at: Date | null;
  security_deposit_returned_at: Date | null;
  security_deposit_notes: string | null;
}

export async function getDeliverables(): Promise<DeliverableRecord[]> {
  const client = await pool.connect();
  try {
    // First try the query with havens join
    let query = `
      SELECT
        ao.id,
        ao.booking_id as booking_uuid,
        ao.name,
        ao.price,
        ao.quantity,
        ao.status,
        ao.delivered_at,
        ao.handled_by,
        ao.notes,
        b.booking_id,
        b.room_name,
        b.check_in_date,
        b.check_in_time,
        b.check_out_date,
        b.check_out_time,
        b.created_at,
        bg.first_name,
        bg.last_name,
        bg.email,
        bg.phone,
        h.tower,
        h.haven_name,
        bp.payment_status,
        bp.total_amount as payment_total_amount,
        bp.down_payment,
        bp.remaining_balance,
        bp.payment_proof_url,
        sd.id as security_deposit_id,
        sd.amount as security_deposit_amount,
        sd.deposit_status as security_deposit_status,
        sd.refunded_amount as security_deposit_refunded_amount,
        sd.forfeited_amount as security_deposit_forfeited_amount,
        sd.payment_method as security_deposit_payment_method,
        sd.payment_proof_url as security_deposit_payment_proof_url,
        sd.held_at as security_deposit_held_at,
        sd.returned_at as security_deposit_returned_at,
        sd.notes as security_deposit_notes
      FROM booking_add_ons ao
      INNER JOIN booking b ON ao.booking_id = b.id
      LEFT JOIN booking_guests bg ON b.id = bg.booking_id
      LEFT JOIN havens h ON b.room_name = h.haven_name
      LEFT JOIN booking_payments bp ON b.id = bp.booking_id
      LEFT JOIN booking_security_deposits sd ON b.id = sd.booking_id
      ORDER BY b.check_in_date DESC, b.created_at DESC
    `;

    let result = await client.query(query);
    
    // Debug: Check if we got any results
    console.log('Query returned rows:', result.rows.length);
    
    // If no results, try without havens join
    if (result.rows.length === 0) {
      console.log('No results with havens join, trying fallback...');
      query = `
        SELECT
          ao.id,
          ao.booking_id as booking_uuid,
          ao.name,
          ao.price,
          ao.quantity,
          ao.status,
          ao.delivered_at,
          ao.handled_by,
          ao.notes,
          b.booking_id,
          b.room_name,
          b.check_in_date,
          b.check_in_time,
          b.check_out_date,
          b.check_out_time,
          b.created_at,
          bg.first_name,
          bg.last_name,
          bg.email,
          bg.phone,
          NULL as tower,
          NULL as haven_name,
          bp.payment_status,
          bp.total_amount as payment_total_amount,
          bp.down_payment,
          bp.remaining_balance,
          bp.payment_proof_url,
          sd.id as security_deposit_id,
          sd.amount as security_deposit_amount,
          sd.deposit_status as security_deposit_status,
          sd.refunded_amount as security_deposit_refunded_amount,
          sd.forfeited_amount as security_deposit_forfeited_amount,
          sd.payment_method as security_deposit_payment_method,
          sd.payment_proof_url as security_deposit_payment_proof_url,
          sd.held_at as security_deposit_held_at,
          sd.returned_at as security_deposit_returned_at,
          sd.notes as security_deposit_notes
        FROM booking_add_ons ao
        INNER JOIN booking b ON ao.booking_id = b.id
        LEFT JOIN booking_guests bg ON b.id = bg.booking_id
        LEFT JOIN booking_payments bp ON b.id = bp.booking_id
        LEFT JOIN booking_security_deposits sd ON b.id = sd.booking_id
        ORDER BY b.check_in_date DESC, b.created_at DESC
      `;
      result = await client.query(query);
      console.log('Fallback query returned rows:', result.rows.length);
    }
    
    // Debug: Show sample data
    if (result.rows.length > 0) {
      console.log('Sample row data:', JSON.stringify(result.rows[0], null, 2));
    }

    // Status mapping
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'preparing': 'Preparing',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'refunded': 'Refunded'
    };

    // Group rows by booking_uuid
    const groupedByBooking = new Map<string, {
      bookingInfo: typeof result.rows[0];
      items: typeof result.rows;
    }>();

    console.log('Grouping rows by booking...');
    for (const row of result.rows) {
      const bookingUuid = row.booking_uuid;
      console.log('Processing row for booking UUID:', bookingUuid);
      if (!groupedByBooking.has(bookingUuid)) {
        groupedByBooking.set(bookingUuid, {
          bookingInfo: row,
          items: []
        });
      }
      groupedByBooking.get(bookingUuid)!.items.push(row);
    }
    
    console.log('Grouped into', groupedByBooking.size, 'bookings');

    // Convert grouped data to DeliverableRecord array
    const records: DeliverableRecord[] = [];

    for (const [bookingUuid, data] of groupedByBooking) {
      const { bookingInfo, items } = data;
      
      // Handle case where bookingInfo might be null/undefined
      if (!bookingInfo) {
        console.warn('Missing booking info for UUID:', bookingUuid);
        continue;
      }

      // Format dates
      const checkinDate = bookingInfo.check_in_date ? new Date(bookingInfo.check_in_date) : new Date();
      const formattedCheckinDate = checkinDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) + (bookingInfo.check_in_time ? ` ${bookingInfo.check_in_time}` : '');

      const checkoutDate = bookingInfo.check_out_date ? new Date(bookingInfo.check_out_date) : new Date();
      const formattedCheckoutDate = checkoutDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) + (bookingInfo.check_out_time ? ` ${bookingInfo.check_out_time}` : '');

      // Format tower
      let towerDisplay = bookingInfo.tower || 'Unknown';
      if (towerDisplay && towerDisplay !== 'Unknown') {
        towerDisplay = towerDisplay
          .split('-')
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }

      // Format haven name
      const havenDisplay = bookingInfo.room_name ? bookingInfo.room_name.replace(/Room/i, 'Haven') : 'Unknown Haven';

      // Process items
      const deliverableItems: DeliverableItem[] = items.map((item: any) => {
        if (!item) {
          console.warn('Null item found for booking:', bookingUuid);
          return null;
        }
        
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        const totalPrice = price * quantity;

        return {
          id: item.id || '',
          name: item.name || 'Unknown Item',
          price,
          quantity,
          total_price: totalPrice,
          formatted_price: new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0
          }).format(price),
          formatted_total: new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0
          }).format(totalPrice),
          status: statusMap[item.status] || 'Pending',
          delivered_at: item.delivered_at,
          handled_by: item.handled_by,
          notes: item.notes
        };
      }).filter(item => item !== null) as DeliverableItem[];

      // Calculate grand total
      const grandTotal = deliverableItems.reduce((sum, item) => sum + item.total_price, 0);

      // Skip if no valid items found
      if (deliverableItems.length === 0) {
        console.warn('No valid items found for booking:', bookingUuid);
        continue;
      }

      // Determine overall status (priority: Pending > Preparing > Delivered > Cancelled > Refunded)
      const statuses = deliverableItems.map((item: any) => item.status);
      let overallStatus = 'Delivered';
      
      if (statuses.length === 0) {
        overallStatus = 'Pending';
      } else if (statuses.includes('Pending')) {
        overallStatus = 'Pending';
      } else if (statuses.includes('Preparing')) {
        overallStatus = 'Preparing';
      } else if (statuses.every(s => s === 'Delivered')) {
        overallStatus = 'Delivered';
      } else if (statuses.includes('Cancelled') && statuses.includes('Delivered')) {
        overallStatus = 'Partial';
      } else if (statuses.every(s => s === 'Cancelled')) {
        overallStatus = 'Cancelled';
      } else if (statuses.every(s => s === 'Refunded')) {
        overallStatus = 'Refunded';
      } else {
        overallStatus = 'Partial';
      }

      // Generate display ID from booking UUID
      const shortId = bookingUuid.substring(0, 8).toUpperCase();

      // Process payment information
      const totalAmount = parseFloat(bookingInfo.payment_total_amount) || 0;
      const downPayment = parseFloat(bookingInfo.down_payment) || 0;
      const remainingBalance = parseFloat(bookingInfo.remaining_balance) || 0;

      // Determine payment type
      let paymentType: 'full' | 'down_payment' | 'unpaid' = 'unpaid';
      if (bookingInfo.payment_status) {
        if (remainingBalance > 0) {
          paymentType = 'down_payment';
        } else if (downPayment > 0 || totalAmount > 0) {
          paymentType = 'full';
        }
      }

      // Format currency helper
      const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0
      }).format(amount);

      // Process security deposit information
      const securityDepositAmount = parseFloat(bookingInfo.security_deposit_amount) || 0;
      const securityDepositRefundedAmount = parseFloat(bookingInfo.security_deposit_refunded_amount) || 0;
      const securityDepositForfeitedAmount = parseFloat(bookingInfo.security_deposit_forfeited_amount) || 0;

      // Map security deposit status
      const securityDepositStatusMap: Record<string, string> = {
        'pending': 'Pending',
        'held': 'Held',
        'returned': 'Returned',
        'partial': 'Partial',
        'forfeited': 'Forfeited'
      };

      records.push({
        id: bookingUuid,
        deliverable_id: `DL-${shortId}`,
        booking_id: bookingInfo.booking_id,
        booking_uuid: bookingUuid,
        guest: `${bookingInfo.first_name || ''} ${bookingInfo.last_name || ''}`.trim() || 'Unknown Guest',
        guest_email: bookingInfo.email,
        guest_phone: bookingInfo.phone,
        haven: havenDisplay,
        tower: towerDisplay,
        items: deliverableItems,
        grand_total: grandTotal,
        formatted_grand_total: formatCurrency(grandTotal),
        overall_status: overallStatus,
        checkin_date: formattedCheckinDate,
        checkin_date_raw: checkinDate,
        checkout_date: formattedCheckoutDate,
        checkout_date_raw: checkoutDate,
        created_at: bookingInfo.created_at || new Date(),
        // Payment information
        payment_status: bookingInfo.payment_status || null,
        payment_type: paymentType,
        total_amount: totalAmount,
        down_payment: downPayment,
        remaining_balance: remainingBalance,
        formatted_total_amount: formatCurrency(totalAmount),
        formatted_down_payment: formatCurrency(downPayment),
        formatted_remaining_balance: formatCurrency(remainingBalance),
        payment_proof_url: bookingInfo.payment_proof_url || null,
        // Security deposit information
        security_deposit_id: bookingInfo.security_deposit_id || null,
        security_deposit_amount: securityDepositAmount,
        formatted_security_deposit_amount: formatCurrency(securityDepositAmount),
        security_deposit_status: securityDepositStatusMap[bookingInfo.security_deposit_status] || null,
        security_deposit_refunded_amount: securityDepositRefundedAmount,
        security_deposit_forfeited_amount: securityDepositForfeitedAmount,
        security_deposit_payment_method: bookingInfo.security_deposit_payment_method || null,
        security_deposit_payment_proof_url: bookingInfo.security_deposit_payment_proof_url || null,
        security_deposit_held_at: bookingInfo.security_deposit_held_at || null,
        security_deposit_returned_at: bookingInfo.security_deposit_returned_at || null,
        security_deposit_notes: bookingInfo.security_deposit_notes || null
      });
      
      console.log('Created record for booking', bookingUuid, 'with', deliverableItems.length, 'items');
    }

    console.log('Final records count:', records.length);
    if (records.length > 0) {
      console.log('Sample record:', JSON.stringify(records[0], null, 2));
    }

    return records;
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    throw new Error('Failed to fetch deliverables');
  } finally {
    client.release();
  }
}

// Update deliverable status
export async function updateDeliverableStatus(deliverableId: string, newStatus: string): Promise<void> {
  const client = await pool.connect();
  try {
    const statusMap: Record<string, string> = {
      'Pending': 'pending',
      'Preparing': 'preparing',
      'Delivered': 'delivered',
      'Cancelled': 'cancelled',
      'Refunded': 'refunded'
    };

    const dbStatus = statusMap[newStatus] || newStatus.toLowerCase();

    if (dbStatus === 'delivered') {
      // Use Philippine timezone (Asia/Manila) for delivered_at timestamp
      await client.query(
        `UPDATE booking_add_ons
         SET status = $2, delivered_at = NOW() AT TIME ZONE 'Asia/Manila'
         WHERE id = $1`,
        [deliverableId, dbStatus]
      );
    } else {
      await client.query(
        `UPDATE booking_add_ons
         SET status = $2
         WHERE id = $1`,
        [deliverableId, dbStatus]
      );
    }
  } catch (error) {
    console.error("Error updating deliverable status:", error);
    throw new Error("Failed to update deliverable status");
  } finally {
    client.release();
  }
}

// Mark deliverable as preparing
export async function markDeliverablePreparing(deliverableId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE booking_add_ons SET status = 'preparing' WHERE id = $1`,
      [deliverableId]
    );
  } catch (error) {
    console.error("Error marking deliverable as preparing:", error);
    throw new Error("Failed to mark deliverable as preparing");
  } finally {
    client.release();
  }
}

// Mark deliverable as delivered
export async function markDeliverableDelivered(deliverableId: string, notes?: string): Promise<void> {
  const client = await pool.connect();
  try {
    // Use Philippine timezone (Asia/Manila) for delivered_at timestamp
    await client.query(
      `UPDATE booking_add_ons
       SET status = 'delivered', delivered_at = NOW() AT TIME ZONE 'Asia/Manila', notes = COALESCE($2, notes)
       WHERE id = $1`,
      [deliverableId, notes]
    );
  } catch (error) {
    console.error("Error marking deliverable as delivered:", error);
    throw new Error("Failed to mark deliverable as delivered");
  } finally {
    client.release();
  }
}

// Cancel deliverable
export async function cancelDeliverable(deliverableId: string, reason?: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE booking_add_ons
       SET status = 'cancelled', notes = COALESCE($2, notes)
       WHERE id = $1`,
      [deliverableId, reason]
    );
  } catch (error) {
    console.error("Error cancelling deliverable:", error);
    throw new Error("Failed to cancel deliverable");
  } finally {
    client.release();
  }
}

// Refund deliverable
export async function refundDeliverable(deliverableId: string, reason?: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE booking_add_ons
       SET status = 'refunded', notes = COALESCE($2, notes)
       WHERE id = $1`,
      [deliverableId, reason]
    );
  } catch (error) {
    console.error("Error refunding deliverable:", error);
    throw new Error("Failed to refund deliverable");
  } finally {
    client.release();
  }
}
