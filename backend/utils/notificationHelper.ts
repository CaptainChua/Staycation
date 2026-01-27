import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  notificationType: string;
}

/**
 * Create notifications for users with specific roles
 */
export async function createNotificationsForRoles(
  roles: string[],
  notificationData: Omit<NotificationData, 'userId'>
): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Get all employees with specified roles
    const employeesQuery = `
      SELECT id, first_name, last_name, email, role
      FROM employees
      WHERE role = ANY($1)
    `;
    
    const employeesResult = await client.query(employeesQuery, [roles]);
    const employees = employeesResult.rows;
    
    // Insert notifications for all matching employees
    if (employees.length > 0) {
      for (const employee of employees) {
        try {
          const notificationQuery = `
            INSERT INTO notifications (user_id, title, message, notification_type, is_read)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING notification_id
          `;
          
          await client.query(notificationQuery, [
            employee.id,
            notificationData.title,
            notificationData.message,
            notificationData.notificationType,
            false
          ]);
          
          console.log(`✅ Notification created for ${employee.role} ${employee.first_name} ${employee.last_name}`);
        } catch (notificationError) {
          console.error(`Failed to create notification for employee ${employee.id}:`, notificationError);
          // Continue with other employees even if one fails
        }
      }
    }
  } catch (error) {
    console.error('Error creating notifications for roles:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create notification for a specific user
 */
export async function createNotificationForUser(
  userId: string,
  notificationData: Omit<NotificationData, 'userId'>
): Promise<void> {
  const client = await pool.connect();
  
  try {
    const notificationQuery = `
      INSERT INTO notifications (user_id, title, message, notification_type, is_read)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING notification_id
    `;
    
    await client.query(notificationQuery, [
      userId,
      notificationData.title,
      notificationData.message,
      notificationData.notificationType,
      false
    ]);
    
    console.log(`✅ Notification created for user ${userId}`);
  } catch (error) {
    console.error('Error creating notification for user:', error);
    throw error;
  } finally {
    client.release();
  }
}
