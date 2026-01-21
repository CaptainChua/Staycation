import NextAuth from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { upsertUser } from "@/backend/controller/userController";
import pool from "@/backend/config/db";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Query the database for the user
          const [rows]: any = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [credentials.email]
          );

          if (rows.length === 0) {
            return null; // User not found
          }

          const user = rows[0];

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null; // Invalid password
          }

          // Return user object
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name || user.email,
            image: user.picture || null,
          };
        } catch (error) {
          console.error("❌ Error during credentials authentication:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Handle Facebook sign-ins
        if (account?.provider === "facebook") {
          const facebookProfile = profile as { id?: string; email?: string; name?: string; picture?: { data?: { url?: string } } };
          
          if (facebookProfile?.id) {
            await upsertUser({
              facebookId: facebookProfile.id,
              email: user.email!,
              name: user.name || undefined,
              picture: user.image || undefined,
            });
            console.log("✅ Facebook user saved to database:", user.email);
          }
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
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };