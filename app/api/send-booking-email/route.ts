import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();

    // Create transporter with your Gmail credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // your-email@gmail.com
        pass: process.env.EMAIL_PASSWORD, // your Gmail App Password
      },
    });

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            padding: 20px;
          }

          .email-container {
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .header {
            background: linear-gradient(135deg, #B8860B 0%, #DAA520 100%);
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
          }

          .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .header p {
            font-size: 16px;
            opacity: 0.95;
          }

          .status-badge {
            background: #B8860B;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            display: inline-block;
            font-size: 14px;
            font-weight: 600;
            margin-top: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .content {
            padding: 35px 30px;
          }

          .greeting {
            font-size: 20px;
            color: #1F2937;
            margin-bottom: 15px;
            font-weight: 600;
          }

          .intro-text {
            color: #6B7280;
            margin-bottom: 25px;
            line-height: 1.7;
          }

          .section-title {
            font-size: 18px;
            color: #1F2937;
            font-weight: 600;
            margin: 30px 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #F3F4F6;
          }

          .info-card {
            background: #F9FAFB;
            border-left: 4px solid #B8860B;
            padding: 20px;
            margin: 15px 0;
            border-radius: 6px;
          }

          .info-row {
            display: table;
            width: 100%;
            padding: 10px 0;
            border-bottom: 1px solid #E5E7EB;
          }

          .info-row:last-child {
            border-bottom: none;
          }

          .info-label {
            display: table-cell;
            font-weight: 600;
            color: #4B5563;
            width: 40%;
            padding-right: 15px;
          }

          .info-value {
            display: table-cell;
            color: #1F2937;
            font-weight: 500;
          }

          .price-summary {
            background: linear-gradient(135deg, #B8860B 0%, #DAA520 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
            text-align: center;
          }

          .price-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 16px;
          }

          .price-total {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid rgba(255, 255, 255, 0.3);
            font-size: 24px;
            font-weight: 700;
          }

          .alert-box {
            background: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 20px;
            margin: 20px 0;
            border-radius: 6px;
          }

          .alert-title {
            font-weight: 700;
            color: #92400E;
            margin-bottom: 10px;
            font-size: 16px;
          }

          .alert-box ul {
            margin-left: 20px;
            color: #78350F;
          }

          .alert-box li {
            margin: 8px 0;
            line-height: 1.6;
          }

          .cta-button {
            text-align: center;
            margin: 30px 0;
          }

          .cta-button a {
            display: inline-block;
            background: linear-gradient(135deg, #B8860B 0%, #DAA520 100%);
            color: white;
            padding: 14px 40px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }

          .cta-button a:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
          }

          .footer {
            background: #1F2937;
            color: #D1D5DB;
            padding: 30px;
            text-align: center;
          }

          .footer-info {
            margin: 10px 0;
            font-size: 14px;
          }

          .footer-divider {
            height: 1px;
            background: #374151;
            margin: 20px 0;
          }

          .footer-copyright {
            font-size: 13px;
            color: #9CA3AF;
            margin-top: 15px;
          }

          .icon {
            display: inline-block;
            margin-right: 8px;
          }

          @media only screen and (max-width: 600px) {
            .email-container {
              border-radius: 0;
            }

            .header {
              padding: 30px 20px;
            }

            .content {
              padding: 25px 20px;
            }

            .info-label, .info-value {
              display: block;
              width: 100%;
              padding: 5px 0;
            }

            .price-row {
              flex-direction: column;
              gap: 5px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <!-- Header -->
          <div class="header">
            <h1>🏖️ Staycation Haven</h1>
            <p>Your Perfect Getaway Awaits</p>
            <span class="status-badge">✓ Booking Confirmed</span>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="greeting">Dear ${bookingData.firstName} ${bookingData.lastName},</div>

            <p class="intro-text">
              Thank you for choosing Staycation Haven! We're thrilled to confirm your reservation.
              Your booking has been successfully approved and we look forward to hosting you.
            </p>

            <!-- Booking Information -->
            <h2 class="section-title">📋 Booking Information</h2>
            <div class="info-card">
              <div class="info-row">
                <span class="info-label">Booking ID</span>
                <span class="info-value">${bookingData.bookingId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Room Type</span>
                <span class="info-value">${bookingData.roomName}</span>
              </div>
            </div>

            <!-- Stay Details -->
            <h2 class="section-title">📅 Stay Details</h2>
            <div class="info-card">
              <div class="info-row">
                <span class="info-label">Check-in Date</span>
                <span class="info-value">${bookingData.checkInDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Check-in Time</span>
                <span class="info-value">${bookingData.checkInTime}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Check-out Date</span>
                <span class="info-value">${bookingData.checkOutDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Check-out Time</span>
                <span class="info-value">${bookingData.checkOutTime}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Number of Guests</span>
                <span class="info-value">${bookingData.guests}</span>
              </div>
            </div>

            <!-- Payment Summary -->
            <h2 class="section-title">💳 Payment Summary</h2>
            <div class="price-summary">
              <div class="price-row">
                <span>Payment Method:</span>
                <span>${bookingData.paymentMethod === 'gcash' ? 'GCash' : bookingData.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : bookingData.paymentMethod}</span>
              </div>
              <div class="price-row">
                <span>Down Payment:</span>
                <span>₱${Number(bookingData.downPayment).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="price-total">
                <div class="price-row">
                  <span>Total Amount:</span>
                  <span>₱${Number(bookingData.totalAmount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <!-- Important Information -->
            <div class="alert-box">
              <div class="alert-title">⚠️ Important Reminders</div>
              <ul>
                <li>Please bring a valid government-issued ID during check-in</li>
                <li>Check-in time starts at ${bookingData.checkInTime}</li>
                <li>Early check-in is subject to room availability</li>
                <li>Keep this confirmation email for your records</li>
                <li>Contact us immediately if you need to modify your booking</li>
                <li>Cancellation policy applies as per our terms and conditions</li>
              </ul>
            </div>

            <p class="intro-text" style="margin-top: 25px;">
              We're committed to making your stay comfortable and memorable. If you have any special
              requests or questions, please don't hesitate to reach out to us.
            </p>

            <!-- Call to Action -->
            <div class="cta-button">
              <a href="http://localhost:3000">Visit Our Website</a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-info">
              <strong>📧 Email:</strong> staycationhaven9@gmail.com
            </div>
            <div class="footer-info">
              <strong>📞 Phone:</strong> +63 123 456 7890
            </div>
            <div class="footer-info">
              <strong>📍 Address:</strong> Your Perfect Destination
            </div>

            <div class="footer-divider"></div>

            <div class="footer-copyright">
              © ${new Date().getFullYear()} Staycation Haven. All rights reserved.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const mailOptions = {
      from: `"Staycation Haven" <${process.env.EMAIL_USER}>`,
      to: bookingData.email,
      subject: `Booking Confirmation - ${bookingData.bookingId}`,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}