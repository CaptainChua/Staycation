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
        <title>Booking Confirmation - Staycation Haven</title>
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
            background-color: #B8860B;
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

          .greeting {
            font-size: 24px;
            color: #1F2937;
            margin-bottom: 16px;
            font-weight: 600;
            font-family: 'Inter', sans-serif;
          }

          .intro-text {
            color: #6B7280;
            margin-bottom: 30px;
            line-height: 1.7;
            font-size: 16px;
          }

          .section-title {
            font-family: 'Poppins', 'Inter', sans-serif;
            font-size: 18px;
            color: #B8860B;
            font-weight: 600;
            margin: 30px 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #F5DEB3;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .info-card {
            background-color: #F9F6F0;
            border-left: 4px solid #B8860B;
            padding: 25px 30px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(184, 134, 11, 0.08);
            transition: transform 0.2s ease;
          }

          .info-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(184, 134, 11, 0.12);
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(184, 134, 11, 0.1);
          }

          .info-row:last-child {
            border-bottom: none;
          }

          .info-label {
            font-weight: 600;
            color: #8B6508;
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

          .price-summary {
            background-color: #B8860B;
            color: white;
            padding: 30px 25px;
            border-radius: 8px;
            margin: 30px 0;
            text-align: center;
            box-shadow: 0 4px 15px rgba(184, 134, 11, 0.2);
          }

          .price-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 12px 0;
            font-size: 16px;
          }

          .price-total {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid rgba(255, 255, 255, 0.3);
            font-size: 24px;
            font-weight: 700;
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

          .cta-button {
            text-align: center;
            margin: 40px 0;
          }

          .cta-button a {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background-color: #B8860B;
            color: white;
            padding: 14px 35px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(184, 134, 11, 0.3);
            transition: all 0.3s ease;
          }

          .cta-button a:hover {
            background-color: #8B6508;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(184, 134, 11, 0.4);
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

          .highlight {
            color: #B8860B;
            font-weight: 600;
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

            .price-row {
              flex-direction: column;
              gap: 8px;
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
              <span>Booking Confirmed</span>
            </div>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="greeting">Dear ${bookingData.firstName} ${bookingData.lastName},</div>

            <p class="intro-text">
              Thank you for choosing <span class="highlight">Staycation Haven</span>! We're absolutely thrilled to confirm your reservation. 
              Your booking has been successfully approved and we're preparing everything to make your stay unforgettable.
            </p>

            <!-- Booking Information -->
            <h2 class="section-title">
              <i class="fas fa-clipboard-list"></i>
              <span>Booking Information</span>
            </h2>
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
            <h2 class="section-title">
              <i class="fas fa-calendar-alt"></i>
              <span>Stay Details</span>
            </h2>
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
            <h2 class="section-title">
              <i class="fas fa-credit-card"></i>
              <span>Payment Summary</span>
            </h2>
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
              <div class="alert-title">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Important Reminders</span>
              </div>
              <ul>
                <li>Please bring a valid government-issued ID during check-in</li>
                <li>Check-in time starts at ${bookingData.checkInTime}</li>
                <li>Early check-in is subject to room availability</li>
                <li>Keep this confirmation email for your records</li>
                <li>Contact us immediately if you need to modify your booking</li>
                <li>Cancellation policy applies as per our terms and conditions</li>
              </ul>
            </div>

            <p class="intro-text" style="margin-top: 30px;">
              We're committed to making your stay comfortable and memorable. If you have any special 
              requests or questions, please don't hesitate to reach out to us. We're here to ensure 
              your staycation is absolutely perfect!
            </p>

            <!-- Call to Action -->
            <div class="cta-button">
              <a href="http://localhost:3000">
                <span>Visit Our Website</span>
                <i class="fas fa-arrow-right"></i>
              </a>
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