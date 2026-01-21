# Facebook Login Database Fix - Implementation Guide

## Problem Identified
Facebook credentials were not being saved to your Neon.com database even though the login was working. This is because:

1. ❌ The NextAuth route file had Facebook provider configured but **no callback logic** to save user data
2. ❌ The `upsertUser` controller function only handled Google OAuth, not Facebook
3. ❌ The database schema likely didn't have a `facebook_id` column

## Changes Made

### 1. ✅ Updated NextAuth Route Handler
**File:** `app/api/auth/[...nextauth]/route.ts`

- Added `signIn` callback with Facebook provider handling
- Now saves Facebook user data when `account?.provider === "facebook"`
- Calls `upsertUser()` with Facebook ID, email, name, and profile picture

```typescript
async signIn({ user, account, profile }) {
  if (account?.provider === "facebook" && profile?.id) {
    await upsertUser({
      facebookId: profile.id,
      email: user.email!,
      name: user.name || undefined,
      picture: user.image || undefined,
    });
    console.log("✅ Facebook user saved to database:", user.email);
  }
  return true;
}
```

### 2. ✅ Updated User Controller
**File:** `backend/controller/userController.ts`

#### Changed the interface to support both Google & Facebook:
```typescript
export interface GoogleUserData {
  googleId?: string;        // Optional
  facebookId?: string;      // Optional (NEW)
  email: string;
  name?: string;
  picture?: string;
}
```

#### Added new function:
```typescript
export async function findUserByFacebookId(facebookId: string): Promise<User | null>
```

#### Updated `createUser()` to handle both providers:
```typescript
INSERT INTO users (google_id, facebook_id, email, name, picture, last_login)
VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
```

#### Updated `updateUserLogin()` to work with both Google and Facebook IDs

#### Updated `upsertUser()` to detect which provider and use correct lookup:
```typescript
if (userData.googleId) {
  existingUser = await findUserByGoogleId(userData.googleId);
} else if (userData.facebookId) {
  existingUser = await findUserByFacebookId(userData.facebookId);
}
```

### 3. ⚠️ Database Schema Migration Required
**File:** `backend/migrations/add_facebook_id.sql`

You need to run this SQL in your Neon.com dashboard to add the `facebook_id` column:

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(255) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_facebook_id ON users(facebook_id);
```

## Steps to Complete the Fix

### Step 1: Run the Database Migration
1. Go to your **Neon.com dashboard**
2. Open the **SQL Editor** for your database
3. Copy and paste the contents of `backend/migrations/add_facebook_id.sql`
4. Execute the SQL query
5. Verify the column was added (you should see no errors)

### Step 2: Redeploy Your Application
```bash
git add .
git commit -m "feat: Add Facebook OAuth database support"
git push
```

Your hosting platform (Vercel, etc.) will auto-deploy the updated code.

### Step 3: Test Facebook Login
1. Go to your login page
2. Click "Continue with Facebook"
3. Complete the Facebook OAuth flow
4. Check your Neon.com database to verify the user was saved with `facebook_id` populated

## Expected Database Changes

### Before (Current State):
```
users table:
- id (UUID)
- google_id (VARCHAR, nullable)
- email (VARCHAR, unique)
- name (VARCHAR, nullable)
- picture (VARCHAR, nullable)
- last_login (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### After (With Migration):
```
users table:
- id (UUID)
- google_id (VARCHAR, nullable)
- facebook_id (VARCHAR, nullable, UNIQUE) ← NEW
- email (VARCHAR, unique)
- name (VARCHAR, nullable)
- picture (VARCHAR, nullable)
- last_login (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- idx_users_facebook_id (INDEX) ← NEW
```

## Verification Checklist

After implementing these changes:

- [ ] Migration file created at `backend/migrations/add_facebook_id.sql`
- [ ] SQL migration executed in Neon.com dashboard
- [ ] NextAuth route has `signIn` callback with Facebook handler
- [ ] User controller updated with Facebook support
- [ ] Code deployed to production
- [ ] Test Facebook login and verify data appears in database
- [ ] Test Google login still works
- [ ] Test email/password login still works

## Troubleshooting

### Issue: "facebook_id column doesn't exist" error
**Solution:** Make sure you ran the migration in your Neon.com dashboard

### Issue: Facebook login still not saving to database
**Solution:** Check browser console and server logs for errors. Verify:
1. FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET environment variables are set
2. Facebook app settings have correct redirect URI
3. Neon connection string is correct

### Issue: "Unique constraint violation on facebook_id"
**Solution:** If you're testing with the same Facebook account multiple times, this is expected. The update path handles this automatically.

## Environment Variables Required

Make sure you have these set in your `.env.local`:
```
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000 (for local) or your production URL
DATABASE_URL=your_neon_postgres_connection_string
```

## Additional Notes

- Google OAuth continues to work exactly as before
- Email/password registration is unaffected
- Both Google and Facebook users can coexist in the same `users` table
- The `facebook_id` field acts as the OAuth identifier for Facebook users (similar to `google_id` for Google)
