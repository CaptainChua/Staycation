import { NextRequest, NextResponse } from "next/server";
import { sendOtpEmail } from "@/backend/utils/sendOtpEmail";

// PUBLIC BY DESIGN — called from the unauthenticated OtpVerification UI when
// a locked-out user requests an OTP. Server-side callers (lib/auth.ts and
// /api/admin/resend-otp) now invoke sendOtpEmail() directly instead of
// HTTP-hopping through this endpoint.
export async function POST(request: NextRequest) {
  try {
    const { email, otp, type, userName } = await request.json();

    if (!email || !otp || !type) {
      return NextResponse.json(
        { success: false, error: "Email, OTP, and type are required" },
        { status: 400 }
      );
    }

    await sendOtpEmail({ email, otp, type, userName });

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to send email";
    console.error("❌ Error sending email:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
