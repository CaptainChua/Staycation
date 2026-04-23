import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET handler - Check authentication status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "Not authenticated", authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST handler - Custom login endpoint (optional)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "Authentication required", success: false },
        { status: 401 }
      );
    }

    // You can add custom logic here after successful Google login
    // For example: save user to database, log login event, etc.

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image,
      },
    });
  } catch (error) {
    console.error("Google login POST error:", error);
    return NextResponse.json(
      { message: "Internal server error", success: false },
      { status: 500 }
    );
  }
}