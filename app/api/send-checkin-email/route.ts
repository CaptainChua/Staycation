import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome! Check-In Confirmation - Staycation Haven</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1F2937;
            background-color: #F9F6F0;
            padding: 20px;
            min-height: 100vh;
          }

          .email-container {
            max-width: 680px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(184, 134, 11, 0.1);
            border: 1px solid rgba(184, 134, 11, 0.1);
          }

          .header {
            background-color: #10B981;
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
          }

          .logo {
            font-family: 'Poppins', 'Inter', sans-serif;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .tagline {
            font-size: 16px;
            font-weight: 400;
            opacity: 0.95;
            margin-bottom: 20px;
          }

          .status-badge {
            background-color: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }

          .content {
            padding: 40px 35px;
            background: #ffffff;
          }

          .welcome-message {
            font-size: 28px;
            color: #10B981;
            margin-bottom: 20px;
            font-weight: 700;
            font-family: 'Poppins', 'Inter', sans-serif;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .intro-text {
            color: #6B7280;
            margin-bottom: 30px;
            line-height: 1.7;
            font-size: 16px;
          }

          .info-card {
            background-color: #F0FDF4;
            border-left: 4px solid #10B981;
            padding: 25px 30px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.08);
            transition: transform 0.2s ease;
          }

          .info-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.12);
          }

          .card-title {
            font-family: 'Poppins', 'Inter', sans-serif;
            font-size: 18px;
            color: #059669;
            font-weight: 600;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(16, 185, 129, 0.1);
          }

          .info-row:last-child {
            border-bottom: none;
          }

          .info-label {
            font-weight: 600;
            color: #6B7280;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .info-value {
            color: #1F2937;
            font-weight: 500;
            font-size: 15px;
            text-align: right;
          }

          .alert-box {
            background-color: #FEF3C7;
            border: 1px solid #F59E0B;
            border-left: 4px solid #F59E0B;
            padding: 25px 30px;
            margin: 30px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);
          }

          .alert-title {
            font-weight: 700;
            color: #92400E;
            margin-bottom: 15px;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .alert-box ul {
            margin-left: 20px;
            color: #78350F;
          }

          .alert-box li {
            margin: 10px 0;
            line-height: 1.6;
            position: relative;
            padding-left: 8px;
          }

          .alert-box li::before {
            content: '•';
            position: absolute;
            left: -8px;
            color: #F59E0B;
            font-weight: bold;
          }

          .contact-card {
            background-color: #F9FAFB;
            border: 1px solid #E5E7EB;
            padding: 25px 30px;
            margin: 30px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }

          .contact-title {
            font-family: 'Poppins', 'Inter', sans-serif;
            font-size: 18px;
            color: #374151;
            font-weight: 600;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .enjoy-card {
            background-color: #DBEAFE;
            border: 1px solid #3B82F6;
            padding: 30px;
            margin: 30px 0;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
          }

          .enjoy-title {
            font-family: 'Poppins', 'Inter', sans-serif;
            font-size: 24px;
            color: #1E40AF;
            font-weight: 700;
            margin-bottom: 10px;
          }

          .enjoy-subtitle {
            color: #3B82F6;
            font-size: 16px;
            font-weight: 500;
          }

          .footer {
            background-color: #1F2937;
            color: #D1D5DB;
            padding: 35px 30px;
            text-align: center;
          }

          .footer-info {
            margin: 10px 0;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .footer-divider {
            height: 1px;
            background-color: #374151;
            margin: 20px 0;
          }

          .footer-copyright {
            font-size: 13px;
            color: #9CA3AF;
            margin-top: 15px;
          }

          @media only screen and (max-width: 600px) {
            .email-container {
              border-radius: 0;
              margin: 0;
            }

            .header {
              padding: 30px 20px;
            }

            .logo {
              font-size: 28px;
            }

            .content {
              padding: 30px 20px;
            }

            .info-row {
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;
            }

            .info-value {
              text-align: left;
            }

            .footer-info {
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
            <div class="logo">
              <i class="fas fa-umbrella-beach"></i> Staycation Haven
            </div>
            <div class="tagline">Your Perfect Getaway Awaits</div>
            <div class="status-badge">
              <i class="fas fa-check-circle"></i>
              <span>Checked In</span>
            </div>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="welcome-message">
              <span>Welcome, ${bookingData.firstName}!</span>
              <i class="fas fa-party-horn"></i>
            </div>

            <p class="intro-text">
              You have successfully checked in! We hope you enjoy your stay at <strong>Staycation Haven</strong>.
              If you need anything during your stay, please don't hesitate to contact our staff.
            </p>

            <!-- Booking Details Card -->
            <div class="info-card">
              <div class="card-title">
                <i class="fas fa-clipboard-list"></i>
                <span>Your Booking Details</span>
              </div>
              <div class="info-row">
                <span class="info-label">Booking ID</span>
                <span class="info-value">${bookingData.bookingId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Room</span>
                <span class="info-value">${bookingData.roomName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Check-In</span>
                <span class="info-value">${bookingData.checkInDate} at ${bookingData.checkInTime}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Check-Out</span>
                <span class="info-value">${bookingData.checkOutDate} at ${bookingData.checkOutTime}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Guests</span>
                <span class="info-value">${bookingData.guests}</span>
              </div>
            </div>

            <!-- Important Information -->
            <div class="alert-box">
              <div class="alert-title">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Important Information</span>
              </div>
              <ul>
                <li>Check-out time is at ${bookingData.checkOutTime} on ${bookingData.checkOutDate}</li>
                <li>Late check-out may incur additional charges</li>
                <li>Please take care of the property and amenities</li>
                <li>For emergencies, contact the front desk immediately</li>
              </ul>
            </div>

            <!-- Contact Information -->
            <div class="contact-card">
              <div class="contact-title">
                <i class="fas fa-phone-alt"></i>
                <span>Need Assistance?</span>
              </div>
              <p class="intro-text" style="margin: 0;">
                Our staff is available 24/7 to help you with any questions or concerns during your stay.
                Feel free to reach out to us anytime!
              </p>
            </div>

            <!-- Enjoy Your Stay Message -->
            <div class="enjoy-card">
              <div class="enjoy-title">
                <i class="fas fa-star"></i> Enjoy Your Stay! <i class="fas fa-star"></i>
              </div>
              <div class="enjoy-subtitle">
                We hope you have a wonderful and memorable experience at Staycation Haven
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-info">
              <i class="fas fa-envelope"></i>
              <span>staycationhaven9@gmail.com</span>
            </div>
            <div class="footer-info">
              <i class="fas fa-phone"></i>
              <span>+63 123 456 7890</span>
            </div>
            <div class="footer-info">
              <i class="fas fa-map-marker-alt"></i>
              <span>Your Perfect Destination</span>
            </div>

            <div class="footer-divider"></div>

            <div class="footer-copyright">
              &copy; ${new Date().getFullYear()} Staycation Haven. All rights reserved.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Staycation Haven" <${process.env.EMAIL_USER}>`,
      to: bookingData.email,
      subject: `Welcome! You're Checked In - ${bookingData.bookingId}`,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Check-in email sent successfully',
    });
  } catch (error) {
    console.error('Check-in email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send check-in email',
      },
      { status: 500 }
    );
  }
}
