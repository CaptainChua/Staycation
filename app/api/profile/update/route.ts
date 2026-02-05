import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import pool from "@/backend/config/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, address, city, country } = body;
    const userEmail = session.user.email;

    // Validate phone number: only digits and max 11 characters
    if (phone && !/^\d{0,11}$/.test(phone)) {
      return NextResponse.json(
        { error: "Phone number must contain only digits" },
        { status: 400 }
      );
    }

    // Update user in database
    const query = `
      UPDATE users
      SET name = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = $1
      RETURNING user_id, email, name, picture, created_at, updated_at
    `;

    const result = await pool.query(query, [userEmail, name]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const updatedUser = result.rows[0];
    console.log("✅ User updated in database:", updatedUser);

    // Revalidate the profile page to clear cache
    revalidatePath("/profile");
    revalidatePath("/profile/edit");

    return NextResponse.json(
      { 
        message: "Profile updated successfully",
        data: {
          name: updatedUser.name,
          email: updatedUser.email,
          id: updatedUser.user_id
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Profile update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}
