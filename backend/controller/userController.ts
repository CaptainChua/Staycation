import pool from '../config/db';

export interface User {
  id: number;
  google_id: string | null;
  facebook_id: string | null;
  email: string;
  name: string | null;
  picture: string | null;
  register_as: string | null;
  created_at: Date;
  updated_at: Date;
  last_login: Date;
}

export interface GoogleUserData {
  googleId?: string;
  facebookId?: string;
  email: string;
  name?: string;
  picture?: string;
  registerAs?: string;
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
 * Find a user by Facebook ID
 */
export async function findUserByFacebookId(facebookId: string): Promise<User | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE facebook_id = $1',
      [facebookId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user by Facebook ID:', error);
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
 * Create a new user from OAuth data (Google or Facebook)
 */
export async function createUser(userData: GoogleUserData): Promise<User> {
  try {
    const result = await pool.query(
<<<<<<< HEAD
      `INSERT INTO users (google_id, facebook_id, email, name, picture, last_login)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
=======
      `INSERT INTO users (google_id, facebook_id, email, name, picture, register_as, last_login)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
>>>>>>> 26aac59 (Update userController changes)
       RETURNING *`,
      [
        userData.googleId || null,
        userData.facebookId || null,
        userData.email,
        userData.name || null,
        userData.picture || null,
<<<<<<< HEAD
=======
        userData.registerAs || null
>>>>>>> 26aac59 (Update userController changes)
      ]
    );

    console.log('✅ Created new user:', result.rows[0].email, 'as', userData.registerAs);
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
  userData: GoogleUserData
): Promise<User> {
  try {
    let query: string;
    let params: any[];

    if (userData.googleId) {
      query = `UPDATE users
       SET name = COALESCE($2, name),
           picture = COALESCE($3, picture),
           last_login = CURRENT_TIMESTAMP
       WHERE google_id = $1
       RETURNING *`;
      params = [userData.googleId, userData.name || null, userData.picture || null];
    } else if (userData.facebookId) {
      query = `UPDATE users
       SET name = COALESCE($2, name),
           picture = COALESCE($3, picture),
           last_login = CURRENT_TIMESTAMP
       WHERE facebook_id = $1
       RETURNING *`;
      params = [userData.facebookId, userData.name || null, userData.picture || null];
    } else {
      throw new Error('Either googleId or facebookId must be provided');
    }

    const result = await pool.query(query, params);

    console.log('✅ Updated user login:', result.rows[0].email);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating user login:', error);
    throw error;
  }
}

/**
 * Create or update user (upsert)
 * This is the main function to call when a user logs in with Google or Facebook
 */
export async function upsertUser(userData: GoogleUserData): Promise<User> {
  try {
    let existingUser: User | null = null;

    // Try to find existing user based on provider
    if (userData.googleId) {
      existingUser = await findUserByGoogleId(userData.googleId);
    } else if (userData.facebookId) {
      existingUser = await findUserByFacebookId(userData.facebookId);
    }

    if (existingUser) {
      // User exists, update login time and profile
      return await updateUserLogin(userData);
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
