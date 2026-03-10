import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const guestName = `${bookingData.firstName || "Guest"}${bookingData.lastName ? ` ${bookingData.lastName}` : ""}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Booking Request Update - Staycation Haven</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; background: #F9F6F0; padding: 20px; }
          .card { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid rgba(184,134,11,0.15); }
          .header { background: #B8860B; color: #fff; padding: 28px 24px; text-align: center; }
          .content { padding: 28px 24px; }
          .title { font-size: 18px; font-weight: 700; margin: 0 0 10px; }
          .muted { color: #6B7280; font-size: 14px; margin: 0 0 18px; }
          .box { background: #FEF3C7; border: 1px solid #F59E0B; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 10px; }
          .box h4 { margin: 0 0 8px; color: #92400E; font-size: 14px; }
          .reason { margin: 0; color: #78350F; white-space: pre-wrap; }
          .details { margin-top: 18px; font-size: 14px; color: #374151; }
          .details div { margin: 6px 0; }
          .footer { padding: 18px 24px; background: #1F2937; color: #D1D5DB; font-size: 13px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div style="font-size: 22px; font-weight: 800;">Staycation Haven</div>
            <div style="opacity: 0.95; margin-top: 6px;">Booking Request Update</div>
          </div>
          <div class="content">
            <p class="title">Hello ${guestName},</p>
            <p class="muted">Your booking request has been reviewed and was not approved at this time.</p>

            <div class="box">
              <h4>Rejection reason</h4>
              <p class="reason">${bookingData.rejectionReason || "(No reason provided)"}</p>
            </div>

            <div class="details">
              <div><strong>Booking ID:</strong> ${bookingData.bookingId || ""}</div>
              <div><strong>Haven:</strong> ${bookingData.roomName || ""}</div>
              <div><strong>Check-in:</strong> ${bookingData.checkInDate || ""} ${bookingData.checkInTime || ""}</div>
              <div><strong>Check-out:</strong> ${bookingData.checkOutDate || ""} ${bookingData.checkOutTime || ""}</div>
            </div>

            <p class="muted" style="margin-top: 18px;">If you have questions, you may reply to this email or submit a new request.</p>
          </div>
          <div class="footer">
            Staycation Haven | This is an automated message
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: bookingData.email,
      subject: `Booking Request Rejected - ${bookingData.bookingId || "Staycation Haven"}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, message: "Rejection email sent" });
  } catch (error) {
    console.error("❌ Error sending rejection email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send rejection email",
      },
      { status: 500 },
    );
  }
}
