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
        turnstileToken: { label: "Turnstile Token", type: "text" },
      },
      async authorize(credentials, req) {
        try {
          console.log("🔐 Attempting login for:", credentials?.email);

          if (!credentials?.email || !credentials?.password || !credentials?.turnstileToken) {
            console.log("❌ Missing credentials");
            throw new Error("Email, password, and security verification are required");
          }

          // Verify Turnstile token first
          const isValidTurnstile = await verifyTurnstileToken(credentials.turnstileToken);
          if (!isValidTurnstile) {
            console.log("❌ Invalid Turnstile token");
            throw new Error("Security verification failed. Please try again.");
          }

          console.log("✅ Turnstile verification passed");

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

            // Verify password
            console.log("🔒 Verifying password...");
            const isValid = await bcrypt.compare(credentials.password, user.password);

            if (!isValid) {
              console.log("❌ Invalid password for employee:", user.email);
              
              // Increment login attempts
              try {
                const updateResult = await pool.query(
                  `UPDATE employees SET login_attempts = login_attempts + 1, updated_at = NOW() WHERE email = $1`,
                  [credentials.email]
                );
                console.log(`✅ Login attempts updated for employee: ${user.email}, rows affected: ${updateResult.rowCount}`);
                
                // Check if login attempts exceeded 3
                const updatedEmployee = await pool.query(
                  `SELECT login_attempts FROM employees WHERE email = $1`,
                  [credentials.email]
                );
                
                const attempts = updatedEmployee.rows[0]?.login_attempts || 0;
                console.log(`📊 New login attempts count for ${user.email}: ${attempts}`);
                
                if (attempts >= 3) {
                  // Generate OTP and send email
                  const otp = Math.floor(100000 + Math.random() * 900000).toString();
                  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
                  
                  // Get IP address and user agent
                  const ipAddress = req?.headers?.['x-forwarded-for'] as string || 
                                   req?.headers?.['x-real-ip'] as string || 
                                   'unknown';
                  const userAgent = req?.headers?.['user-agent'] as string || 'unknown';
                  
                  // Remove existing OTP for this email and insert new one
                  await pool.query(
                    `DELETE FROM otp_verification WHERE email = $1 AND otp_type = 'ACCOUNT_LOCK'`,
                    [credentials.email]
                  );
                  
                  // Insert new OTP into otp_verification table with IP and user agent
                  await pool.query(
                    `INSERT INTO otp_verification (email, otp_code, otp_type, expires_at, ip_address, user_agent, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                    [credentials.email, otp, 'ACCOUNT_LOCK', expiresAt, ipAddress, userAgent]
                  );
                  
                  console.log(`🔒 Account locked for ${user.email}. OTP: ${otp}`);
                  console.log(`📍 IP: ${ipAddress}, User Agent: ${userAgent}`);
                  
                  // Send email with OTP
                  try {
                    const emailResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/send-email`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        email: credentials.email,
                        otp: otp,
                        type: 'ACCOUNT_LOCK',
                        userName: `${user.first_name} ${user.last_name}`
                      })
                    });
                    
                    if (emailResponse.ok) {
                      console.log(`✅ OTP email sent to ${credentials.email}`);
                    } else {
                      console.error(`❌ Failed to send OTP email to ${credentials.email}`);
                    }
                  } catch (emailError) {
                    console.error('❌ Error sending OTP email:', emailError);
                  }
                  
                  throw new Error("Account locked due to multiple failed attempts. Please check your email for OTP verification.");
                }
                
              } catch (updateError: any) {
                console.error('❌ Failed to update login attempts:', updateError.message);
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
        // Handle Google sign-ins
        if (account?.provider === "google" && profile?.sub) {
          await upsertUser({
            googleId: profile.sub,
            email: user.email!,
            name: user.name || undefined,
            picture: user.image || undefined,
          });
          console.log("✅ User saved to database:", user.email);
        } 
        // Handle Facebook sign-ins
        else if (account?.provider === "facebook" && profile?.sub) {
          await upsertFacebookUser({
            facebookId: profile.sub,
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
        console.error("❌ Error saving user to database:", error);
        return true;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        console.log("✅ JWT token created with role:", (user as { role?: string }).role);
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        // For Google and Facebook users, fetch the actual database UUID
        if (token.sub && !token.role) {
          try {
            // Query users table to get the UUID by google_id or facebook_id
            let result = await pool.query(
              "SELECT user_id FROM users WHERE google_id = $1",
              [token.sub]
            );

            // If not found as Google user, try Facebook
            if (!result.rows[0]) {
              result = await pool.query(
                "SELECT user_id FROM users WHERE facebook_id = $1",
                [token.sub]
              );
            }

            if (result.rows[0]) {
              session.user.id = String(result.rows[0].user_id);
              console.log("✅ OAuth user session created with DB ID:", result.rows[0].user_id);
            } else {
              // Fallback to token sub if user not found in DB
              session.user.id = token.sub!;
            }
          } catch (error) {
            console.error("❌ Error fetching user ID:", error);
            session.user.id = token.sub!;
          }
        } else {
          // For credentials users, use the token.sub directly
          session.user.id = token.sub!;
        }

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
