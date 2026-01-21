# Quick Setup Guide - Facebook Login with register_as

## What's Implemented ✅

When a user signs in with Facebook:
- **facebook_id** is saved to database (Facebook's user ID)
- **register_as** is set to `"facebook"` 
- User data (name, email, picture) is synced to database
- Profile picture is fetched from Facebook

## 3 Files Modified

### 1. `backend/controller/userController.ts`
- Added `facebook_id` and `register_as` to User interface
- Added `findUserByFacebookId()` function
- Updated `createUser()` and `updateUserLogin()` for both providers

### 2. `lib/auth.ts`
- Added FacebookProvider
- Updated signIn callback to handle Facebook
- Sets `registerAs: "facebook"` when saving

### 3. `backend/migrations/add_facebook_and_register_as.sql`
- Database migration script (copy & paste to Neon.com)

## Database Setup (REQUIRED)

### Copy this SQL to Neon.com Dashboard → SQL Editor:

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(255) UNIQUE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS register_as VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_users_facebook_id ON users(facebook_id);
CREATE INDEX IF NOT EXISTS idx_users_register_as ON users(register_as);
```

Then click Execute.

## Test It

1. Deploy your code: `git push`
2. Go to login page
3. Click "Continue with Facebook"
4. Login with your Facebook account
5. Check Neon.com database:

```sql
SELECT email, facebook_id, register_as 
FROM users 
WHERE register_as = 'facebook' 
LIMIT 5;
```

You should see your data!

## Query Your Data

### All Facebook users:
```sql
SELECT email, name, facebook_id, register_as FROM users WHERE register_as = 'facebook';
```

### All Google users:
```sql
SELECT email, name, google_id, register_as FROM users WHERE register_as = 'google';
```

### Count by registration method:
```sql
SELECT register_as, COUNT(*) FROM users GROUP BY register_as;
```

## Environment Variables (Already Set?)

Make sure these are in your `.env.local`:
```
FACEBOOK_CLIENT_ID=your_id_here
FACEBOOK_CLIENT_SECRET=your_secret_here
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000 (dev) or production url
```

## What's Working Now

✅ Facebook login saves to database  
✅ register_as = "facebook" field populated  
✅ User name, email, picture synced  
✅ Google login still works (register_as = "google")  
✅ Email/password login still works  

Done! 🎉
