import pool from '../config/db';

export interface User {
  id: number;
  google_id: string;
  facebook_id?: string;
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

// ============================================
// FACEBOOK LOGIN INTERFACES
// ============================================
/**
 * Interface for Facebook user data from OAuth provider
 * Used to store and manage user information from Facebook login
 */
export interface FacebookUserData {
  facebookId: string;
  email: string;
  name?: string;
  picture?: string;
}

// ============================================
// GOOGLE LOGIN FUNCTIONS (Original Implementation)
// ============================================
/**
 * Find a user by Google ID
 * Original function for Google OAuth authentication
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
 * Original function to lookup users by email address
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
 * Original function for creating users during Google signup
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
 * Original function for updating Google users on re-login
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
 * Original implementation for Google OAuth
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
 * Original function to retrieve all users from database
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
 * Original function to remove a user from the database
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

// ============================================
// FACEBOOK LOGIN FUNCTIONS (New Implementation)
// ============================================
/**
 * Find a user by Facebook ID
 * NEW: For Facebook OAuth authentication
 * Retrieves user from database using their Facebook ID
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
 * Create a new user from Facebook OAuth data
 * NEW: For creating users during Facebook signup
 * Stores Facebook ID and sets user_role as 'facebook' to indicate Facebook login method
 */
export async function createFacebookUser(userData: FacebookUserData): Promise<User> {
  try {
    const result = await pool.query(
      `INSERT INTO users (facebook_id, email, name, picture, user_role, last_login)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userData.facebookId, userData.email, userData.name || null, userData.picture || null, 'facebook']
    );

    console.log('✅ Created new Facebook user:', result.rows[0].email);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating Facebook user:', error);
    throw error;
  }
}

/**
 * Update Facebook user's last login time and profile information
 * NEW: For updating Facebook users on re-login
 * Updates profile data while preserving the 'facebook' user_role
 */
export async function updateFacebookUserLogin(
  facebookId: string,
  userData: Partial<FacebookUserData>
): Promise<User> {
  try {
    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($2, name),
           picture = COALESCE($3, picture),
           last_login = CURRENT_TIMESTAMP
       WHERE facebook_id = $1
       RETURNING *`,
      [facebookId, userData.name || null, userData.picture || null]
    );

    console.log('✅ Updated Facebook user login:', result.rows[0].email);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating Facebook user login:', error);
    throw error;
  }
}

/**
 * Create or update Facebook user (upsert)
 * NEW: Main function to call when a user logs in with Facebook
 * Checks if user exists, updates if found, creates if new
 * Sets user_role as 'facebook' instead of default 'haven'
 */
export async function upsertFacebookUser(userData: FacebookUserData): Promise<User> {
  try {
    // Try to find existing user
    const existingUser = await findUserByFacebookId(userData.facebookId);

    if (existingUser) {
      // User exists, update login time and profile
      return await updateFacebookUserLogin(userData.facebookId, userData);
    } else {
      // User doesn't exist, create new one with facebook role
      return await createFacebookUser(userData);
    }
  } catch (error) {
    console.error('Error upserting Facebook user:', error);
    throw error;
  }
}
