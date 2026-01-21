import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { upsertUser } from "@/backend/controller/userController";
import pool from "@/backend/config/db";
import bcrypt from "bcryptjs";

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
      },
      async authorize(credentials) {
        try {
          console.log("🔐 Attempting login for:", credentials?.email);

          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Missing credentials");
            throw new Error("Email and password are required");
          }

          // First check employee table (for admin/staff users)
          console.log("📊 Querying employees table...");
          const employeeResult = await pool.query(
            "SELECT id, email, password, role, first_name, last_name FROM employees WHERE email = $1",
            [credentials.email]
          );

          if (employeeResult.rows.length > 0) {
            const user = employeeResult.rows[0];
            console.log("✅ Employee found:", user.email, "- Role:", user.role);

            // Verify password
            console.log("🔒 Verifying password...");
            const isValid = await bcrypt.compare(credentials.password, user.password);

            if (!isValid) {
              console.log("❌ Invalid password");
              throw new Error("Invalid email or password");
            }

            console.log("✅ Password valid! Employee login successful");

            // Create activity log for employee login
            try {
              await pool.query(
                `INSERT INTO staff_activity_logs (employment_id, action_type, action, details, created_at)
                 VALUES ($1, $2, $3, $4, NOW())`,
                [
                  user.id,
                  'login',
                  'Logged into system',
                  `${user.first_name} ${user.last_name} logged in successfully via NextAuth`
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
            registerAs: "google",
          });
          console.log("✅ Google user saved to database:", user.email);
          return true;
        }
        
        // Handle Facebook sign-ins
        if (account?.provider === "facebook" && profile?.id) {
          await upsertUser({
            facebookId: profile.id,
            email: user.email!,
            name: user.name || undefined,
            picture: user.image || undefined,
            registerAs: "facebook",
          });
          console.log("✅ Facebook user saved to database:", user.email);
          return true;
        }
        
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

        const credentialUser = userResult.rows[0];
        console.log("✅ User found:", credentialUser.email, "- Role:", credentialUser.user_role);

        // Verify password
        console.log("🔒 Verifying password...");
        const isValid = await bcrypt.compare(
          String(credentials?.password || ''), 
          String(credentialUser.password)
        );

        if (!isValid) {
          console.log("❌ Invalid password");
          throw new Error("Invalid email or password");
        }

        console.log("✅ Password valid! User login successful");

        // Create activity log for regular user login
        try {
          await pool.query(
            `INSERT INTO staff_activity_logs (user_id, action_type, action, details, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [
              credentialUser.user_id,
              'login',
              'Logged into system',
              `${credentialUser.name} logged in successfully via NextAuth`
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
            [credentialUser.user_id]
          );
          console.log("✅ Updated last_login for user");
        } catch (updateError) {
          console.error("❌ Failed to update last_login:", updateError);
        }

        // Return true to allow sign in
        console.log("✅ Credentials authentication successful for:", credentialUser.email);
        return true;
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
        // For Google users, fetch the actual database UUID
        if (token.sub && !token.role) {
          try {
            // Query users table to get the UUID by google_id
            const result = await pool.query(
              "SELECT user_id FROM users WHERE google_id = $1",
              [token.sub]
            );

            if (result.rows[0]) {
              session.user.id = String(result.rows[0].user_id);
              console.log("✅ Google user session created with DB ID:", result.rows[0].user_id);
            } else {
              // Fallback to Google ID if user not found in DB
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