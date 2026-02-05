import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getAllUsers,
  findUserByEmail,
} from "@/backend/controller/userController";
import pool from "@/backend/config/db";

// GET all users or current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    // Check if requesting all users (admin endpoint)
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all");
    const userId = searchParams.get("userId");

    if (all === "true") {
      // Get all users (you might want to add admin check here)
      const users = await getAllUsers();
      return NextResponse.json({ users });
    }

    // Get specific user by ID for profile pictures
    if (userId) {
      try {
        const result = await pool.query(
          "SELECT user_id, name, email, picture FROM users WHERE user_id = $1",
          [userId],
        );

        if (result.rows[0]) {
          return NextResponse.json({ user: result.rows[0] });
        } else {
          return NextResponse.json(
            { message: "User not found" },
            { status: 404 },
          );
        }
      } catch (error) {
        console.error("Error fetching user by ID:", error);
        return NextResponse.json(
          { message: "Error fetching user" },
          { status: 500 },
        );
      }
    }

    // Get current user's data from database
    const user = await findUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json(
        { message: "User not found in database" },
        { status: 404 },
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
