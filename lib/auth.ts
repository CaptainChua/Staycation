import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { upsertUser, upsertFacebookUser } from "@/backend/controller/userController";
import pool from "@/backend/config/db";
import bcrypt from "bcryptjs";

// Verify Turnstile token
const verifyTurnstileToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${encodeURIComponent(process.env.TURNSTILE_SECRET_KEY || '')}&response=${encodeURIComponent(token)}`,
    });

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
};

export const authOptions: NextAuthOptions = {
  providers: [
    // Google login
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Facebook login
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    // Credentials login
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        turnstileToken: { label: "Turnstile Token", type: "text", optional: true },
        isOtpLogin: { label: "OTP Login", type: "text", optional: true },
      },
      async authorize(credentials, req) {
        try {
          console.log("🔐 Attempting login for:", credentials?.email);

          if (!credentials?.email) {
            console.log("❌ Missing email");
            throw new Error("Email is required");
          }

          // 🔐 Only require password if NOT OTP login
          if (!credentials?.isOtpLogin && !credentials?.password) {
            console.log("❌ Missing password for normal login");
            throw new Error("Password is required");
          }

          // Get IP address and user agent from request
          const ipAddress = req?.headers?.['x-forwarded-for'] as string || 
                           req?.headers?.['x-real-ip'] as string || 
                           'unknown';
          const userAgent = req?.headers?.['user-agent'] as string || 'unknown';

          // First check employee table (for admin/staff users)
          console.log("📊 Querying employees table...");
          const employeeResult = await pool.query(
            "SELECT id, email, password, role, first_name, last_name, ip_address, user_agent, login_attempts FROM employees WHERE email = $1",
            [credentials.email]
          );

          if (employeeResult.rows.length > 0) {
            const user = employeeResult.rows[0];
            console.log("✅ Employee found:", user.email, "- Role:", user.role, "- Current attempts:", user.login_attempts || 0);

            // 🔒 IMMEDIATE LOCK CHECK (REQUIRED)
          if ((user.login_attempts || 0) >= 3) {
            console.log(`🔒 Account already locked for ${user.email}`);
            throw new Error(
              "Account locked due to multiple failed attempts. Please check your email for OTP verification."
            );
          }


            // For employees, require turnstile token verification
            // 🔐 Require Turnstile ONLY if this is NOT an OTP-based auto login
          if (!credentials?.turnstileToken && !credentials?.isOtpLogin) {
            console.log("❌ Missing turnstile token for employee");
            throw new Error("Email, password, and security verification are required");
          }


            // Verify Turnstile token for employees
            if (!credentials?.isOtpLogin) {
              const isValidTurnstile = await verifyTurnstileToken(credentials.turnstileToken);
              if (!isValidTurnstile) {
                console.log("❌ Invalid Turnstile token");
                throw new Error("Security verification failed. Please try again.");
              }
              console.log("✅ Turnstile verification passed for employee");
            }

            console.log("✅ Turnstile verification passed for employee");

            // Verify password
            // Skip password check if OTP login
            let isValid = false;
            if (credentials?.isOtpLogin) {
              isValid = true; // OTP login bypasses password
            } else {
              console.log("🔒 Verifying password...");
              isValid = await bcrypt.compare(credentials.password || '', user.password);
            }

            if (!isValid) {
              console.log("❌ Invalid password for employee:", user.email);

              // ⬆ Increment login attempts
              const attemptUpdate = await pool.query(
                `UPDATE employees
                SET login_attempts = COALESCE(login_attempts, 0) + 1,
                    updated_at = NOW()
                WHERE email = $1
                RETURNING login_attempts`,
                [credentials.email]
              );

              const attempts = attemptUpdate.rows[0].login_attempts;
              console.log(`📊 Login attempts for ${user.email}: ${attempts}`);

              // 🔒 LOCK ACCOUNT AT 3 ATTEMPTS
              if (attempts >= 3) {
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

                // Remove old OTP
                await pool.query(
                  `DELETE FROM otp_verification
                  WHERE email = $1 AND otp_type = 'ACCOUNT_LOCK'`,
                  [credentials.email]
                );

                // Insert new OTP
                await pool.query(
                  `INSERT INTO otp_verification
                  (email, otp_code, otp_type, expires_at, ip_address, user_agent, created_at)
                  VALUES ($1, $2, 'ACCOUNT_LOCK', $3, $4, $5, NOW())`,
                  [
                    credentials.email,
                    otp,
                    expiresAt,
                    ipAddress !== 'unknown' ? ipAddress : null,
                    userAgent !== 'unknown' ? userAgent : null,
                  ]
                );

                // Send OTP email
                await fetch(
                  `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/send-email`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: credentials.email,
                      otp,
                      type: "ACCOUNT_LOCK",
                      userName: `${user.first_name} ${user.last_name}`,
                    }),
                  }
                );

                throw new Error(
                  "Account locked due to multiple failed attempts. Please check your email for OTP verification."
                );
              }

              throw new Error("Invalid email or password");
            }


            console.log("✅ Password valid! Employee login successful");

            // Reset login attempts on successful login
            try {
              await pool.query(
                `UPDATE employees SET login_attempts = 0, last_login = NOW(), updated_at = NOW() WHERE id = $1`,
                [user.id]
              );
              console.log(`✅ Login attempts reset for employee: ${user.email}`);
            } catch (resetError: any) {
              console.error('❌ Failed to reset login attempts:', resetError.message);
            }

            // Update employee IP address and user agent if not already set
            if (!user.ip_address || !user.user_agent) {
              try {
                await pool.query(
                  `UPDATE employees 
                   SET ip_address = COALESCE($1, ip_address), 
                       user_agent = COALESCE($2, user_agent),
                       updated_at = NOW()
                   WHERE id = $3`,
                  [ipAddress !== 'unknown' ? ipAddress : null, 
                   userAgent !== 'unknown' ? userAgent : null, 
                   user.id]
                );
                console.log('✅ Updated employee IP address and user agent');
              } catch (updateError) {
                console.error('❌ Failed to update employee IP/user agent:', updateError);
              }
            }

            // Create activity log for employee login using the proper function
            try {
              await pool.query(
                `SELECT log_employee_activity($1, $2, $3, $4, $5, $6, $7)`,
                [
                  user.id,
                  'LOGIN',
                  `${user.first_name} ${user.last_name} logged into the system`,
                  null,
                  null,
                  ipAddress !== 'unknown' ? ipAddress : null,
                  userAgent !== 'unknown' ? userAgent : null
                ]
              );
              console.log('✅ Activity log created for employee login');
            } catch (logError: unknown) {
              const error = logError as { message?: string; code?: string; detail?: string };
              console.error('❌ Failed to create activity log:', logError);
              console.error('Error details:', {
                message: error?.message,
                code: error?.code,
                detail: error?.detail
              });
            }

            // Return employee user object
            return {
              id: String(user.id),
              email: user.email,
              name: `${user.first_name} ${user.last_name}`,
              role: user.role,
            };
          }

          // If not found in employees, check users table (for regular users)
          console.log("📊 Querying users table...");
          const userResult = await pool.query(
            "SELECT user_id, email, password, user_role, name FROM users WHERE email = $1",
            [credentials.email]
          );

          if (userResult.rows.length === 0) {
            console.log("❌ User not found in any table");
            throw new Error("Invalid email or password");
          }

          const user = userResult.rows[0];
          console.log("✅ User found:", user.email, "- Role:", user.user_role);

          // Verify password
          console.log("🔒 Verifying password...");
          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            console.log("❌ Invalid password");
            throw new Error("Invalid email or password");
          }

          console.log("✅ Password valid! User login successful");

          // Update last_login timestamp
          try {
            await pool.query(
              "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1",
              [user.user_id]
            );
            console.log("✅ Updated last_login for user");
          } catch (updateError) {
            console.error("❌ Failed to update last_login:", updateError);
          }

          // Return regular user object
          return {
            id: String(user.user_id),
            email: user.email,
            name: user.name,
            role: user.user_role,
          };
        } catch (error: unknown) {
          const authError = error as { message?: string; stack?: string };
          console.error("❌ Auth error:", authError.message);
          console.error("Stack:", authError.stack);

          // Re-throw the error so NextAuth can handle it
          throw error;
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async signIn({ user, account, profile, credentials }) {
      try {
        console.log("🚀 SignIn callback triggered");
        console.log("Provider:", account?.provider);
        console.log("User email:", user.email);
        console.log("Full profile:", JSON.stringify(profile, null, 2));
        
        // Handle Google sign-ins
        if (account?.provider === "google" && profile?.sub) {
          console.log("🟢 Google provider detected");
          await upsertUser({
            googleId: profile.sub,
            email: user.email!,
            name: user.name || undefined,
            picture: user.image || undefined,
          });
          console.log("✅ Google user saved to database:", user.email);
        } 
        // Handle Facebook sign-ins
        else if (account?.provider === "facebook") {
          console.log("🔵 Facebook provider detected");
          console.log("Profile object:", profile);
          console.log("Profile.id:", (profile as any)?.id);
          console.log("Profile.sub:", profile?.sub);
          
          const facebookId = (profile?.sub || (profile as any)?.id) as string;
          
          if (!facebookId) {
            console.error("❌ No Facebook ID found in profile!");
            throw new Error("No Facebook ID in profile");
          }
          
          console.log("🔵 Facebook login detected. Profile ID:", facebookId, "Email:", user.email);
          console.log("🔵 About to call upsertFacebookUser with:", { facebookId, email: user.email, name: user.name });
          
          await upsertFacebookUser({
            facebookId: facebookId,
            email: user.email!,
            name: user.name || undefined,
            picture: user.image || undefined,
          });
          
          console.log("✅ Facebook user saved to database:", user.email);
        } 
        else {
          // Handle regular credential sign-ins
          console.log("🔐 Processing credentials login for:", credentials?.email);

          // Check regular users table (not employees)
          console.log("📊 Querying users table...");
          const userResult = await pool.query(
            "SELECT user_id, email, password, user_role, name FROM users WHERE email = $1",
            [credentials?.email || '']
          );

          if (userResult.rows.length === 0) {
            console.log("❌ User not found in users table");
            throw new Error("Invalid email or password");
          }

          const user = userResult.rows[0];
          console.log("✅ User found:", user.email, "- Role:", user.user_role);

          // Verify password
          console.log("🔒 Verifying password...");
          const isValid = await bcrypt.compare(
            String(credentials?.password || ''), 
            String(user.password)
          );

          if (!isValid) {
            console.log("❌ Invalid password");
            throw new Error("Invalid email or password");
          }

          console.log("✅ Password valid! User login successful");

          // Create activity log for regular user login
          try {
            await pool.query(
              `INSERT INTO employee_activity_logs (user_id, action_type, action, details, created_at)
               VALUES ($1, $2, $3, $4, NOW())`,
              [
                user.user_id,
                'login',
                'Logged into system',
                `${user.name} logged in successfully via NextAuth`
              ]
            );
            console.log('✅ Activity log created for user login');
          } catch (logError) {
            const error = logError as { message?: string; code?: string; detail?: string };
            console.error('❌ Failed to create activity log:', logError);
            console.error('Error details:', {
              message: error?.message,
              code: error?.code,
              detail: error?.detail
            });
          }

          // Update last_login timestamp
          try {
            await pool.query(
              "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1",
              [user.user_id]
            );
            console.log("✅ Updated last_login for user");
          } catch (updateError) {
            console.error("❌ Failed to update last_login:", updateError);
          }

          // Return true to allow sign in
          console.log("✅ Credentials authentication successful for:", user.email);
          return true;
        }
        return true;
      } catch (error) {
        console.error("❌ Error in signIn callback:", error);
        console.error("❌ Error details:", JSON.stringify(error, null, 2));
        return true;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        console.log("✅ JWT token created with role:", (user as { role?: string }).role);
        
        // For OAuth users (no role), fetch and store the database user_id and provider IDs
        if (!token.role && user.email) {
          try {
            console.log("🔵 Fetching OAuth user database info for:", user.email);
            const result = await pool.query(
              "SELECT user_id, facebook_id, google_id FROM users WHERE email = $1",
              [user.email]
            );
            
            if (result.rows[0]) {
              token.db_id = result.rows[0].user_id;
              token.facebook_id = result.rows[0].facebook_id;
              token.google_id = result.rows[0].google_id;
              console.log("✅ Stored in JWT - DB ID:", token.db_id, "Facebook ID:", token.facebook_id, "Google ID:", token.google_id);
            }
          } catch (error) {
            console.error("❌ Error fetching OAuth user IDs in JWT:", error);
          }
        }
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        // Priority 1: Use the database user_id stored in JWT (fastest path)
        if (token.db_id) {
          // Ensure db_id is converted to string properly
          const dbIdStr = typeof token.db_id === 'string' ? token.db_id : String(token.db_id);
          session.user.id = dbIdStr;
          console.log("✅ Session created with DB ID from JWT:", dbIdStr);
        }
        // Priority 2: For OAuth users (Google or Facebook) without stored DB ID
        // Check if token.role is 'google' or 'facebook' OR token.sub exists
        else if (token.sub && (token.role === 'google' || token.role === 'facebook' || token.role === 'haven')) {
          try {
            console.log("🔍 OAuth user detected, querying for user ID using token.sub:", token.sub, "role:", token.role);
            
            // Try Google ID first
            let result = await pool.query(
              "SELECT user_id FROM users WHERE google_id = $1",
              [token.sub]
            );

            // If not found as Google user, try Facebook ID
            if (!result.rows[0]) {
              console.log("⚠️ Not found by Google ID, trying Facebook ID:", token.sub);
              result = await pool.query(
                "SELECT user_id FROM users WHERE facebook_id = $1",
                [token.sub]
              );
            }

            // If found, use the database UUID
            if (result.rows[0]) {
              const userId = result.rows[0].user_id;
              const userIdStr = typeof userId === 'string' ? userId : String(userId);
              session.user.id = userIdStr;
              console.log("✅ OAuth user session created with DB ID:", userIdStr);
            } else {
              // Fallback to token sub if user not found in DB (shouldn't happen if upsert worked)
              console.warn("⚠️ User not found in database by provider ID, using token.sub:", token.sub);
              session.user.id = token.sub!;
            }
          } catch (error) {
            console.error("❌ Error fetching user ID in session callback:", error);
            session.user.id = token.sub!;
          }
        }
        // Priority 3: For credential users (employees or regular users with role), use token.id or token.sub
        else if (token.role && token.role !== 'google' && token.role !== 'facebook' && token.role !== 'haven') {
          session.user.id = token.id || token.sub!;
          console.log("✅ Session created with employee/credential ID:", token.id || token.sub);
        }
        // Priority 4: Fallback to token.sub or token.id
        else {
          session.user.id = token.id || token.sub!;
          console.log("⚠️ Using fallback ID:", token.id || token.sub);
        }

        // Add role if available
        if (token.role) {
          (session.user as { role?: string }).role = token.role as string;
          console.log("✅ Session created with role:", token.role);
        }
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  
  // ✅ ADD: Enable debug mode to see more logs
  debug: process.env.NODE_ENV === 'development',
};



// import { NextAuthOptions } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import { upsertUser } from "@/backend/controller/userController";

// export const authOptions: NextAuthOptions = {
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     }),
//   ],
//   pages: {
//     signIn: "/login",
//   },
//   callbacks: {
//     async signIn({ user, account, profile }) {
//       try {
//         // Only process Google sign-ins
//         if (account?.provider === "google" && profile?.sub) {
//           // Save or update user in database
//           await upsertUser({
//             googleId: profile.sub,
//             email: user.email!,
//             name: user.name || undefined,
//             picture: user.image || undefined,
//           });

//           console.log("✅ User saved to database:", user.email);
//         }

//         return true; // Allow sign in
//       } catch (error) {
//         console.error("❌ Error saving user to database:", error);
//         // Still allow sign in even if database save fails
//         return true;
//       }
//     },
//     async session({ session, token }) {
//       if (session.user) {
//         session.user.id = token.sub!;
//       }
//       return session;
//     },
//     async jwt({ token, user, account, profile }) {
//       if (user) {
//         token.id = user.id;
//       }
//       if (account?.provider === "google" && profile?.sub) {
//         token.googleId = profile.sub;
//       }
//       return token;
//     },
//   },
//   secret: process.env.NEXTAUTH_SECRET,
// };
