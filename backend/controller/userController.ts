import pool from '../config/db';

export interface User {
  id: number;
  google_id: string;
  email: string;
  name: string | null;
  picture: string | null;
  created_at: Date;
  updated_at: Date;
  last_login: Date;
}

export interface GoogleUserData {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Find a user by Google ID
 */
export async function findUserByGoogleId(googleId: string): Promise<User | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user by Google ID:', error);
    throw error;
  }
}

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
}

/**
 * Create a new user from Google OAuth data
 */
export async function createUser(userData: GoogleUserData): Promise<User> {
  try {
    const result = await pool.query(
      `INSERT INTO users (google_id, email, name, picture, last_login)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userData.googleId, userData.email, userData.name || null, userData.picture || null]
    );

    console.log('✅ Created new user:', result.rows[0].email);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Update user's last login time and profile information
 */
export async function updateUserLogin(
  googleId: string,
  userData: Partial<GoogleUserData>
): Promise<User> {
  try {
    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($2, name),
           picture = COALESCE($3, picture),
           last_login = CURRENT_TIMESTAMP
       WHERE google_id = $1
       RETURNING *`,
      [googleId, userData.name || null, userData.picture || null]
    );

    console.log('✅ Updated user login:', result.rows[0].email);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating user login:', error);
    throw error;
  }
}

/**
 * Create or update user (upsert)
 * This is the main function to call when a user logs in with Google
 */
export async function upsertUser(userData: GoogleUserData): Promise<User> {
  try {
    // Try to find existing user
    const existingUser = await findUserByGoogleId(userData.googleId);

    if (existingUser) {
      // User exists, update login time and profile
      return await updateUserLogin(userData.googleId, userData);
    } else {
      // User doesn't exist, create new one
      return await createUser(userData);
    }
  } catch (error) {
    console.error('Error upserting user:', error);
    throw error;
  }
}

/**
 * Get all users (for admin purposes)
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const result = await pool.query(
      'SELECT * FROM users ORDER BY created_at DESC'
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

/**
 * Delete a user by ID
 */
export async function deleteUser(userId: number): Promise<boolean> {
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );

    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}
