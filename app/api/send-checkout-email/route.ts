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
        <title>Thank You For Your Stay! - Staycation Haven</title>
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
            background-color: #8B5CF6;
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

          .thank-you-message {
            font-size: 28px;
            color: #8B5CF6;
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
            background-color: #F5F3FF;
            border-left: 4px solid #8B5CF6;
            padding: 25px 30px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(139, 92, 246, 0.08);
            transition: transform 0.2s ease;
          }

          .info-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.12);
          }

          .card-title {
            font-family: 'Poppins', 'Inter', sans-serif;
            font-size: 18px;
            color: #7C3AED;
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
            border-bottom: 1px solid rgba(139, 92, 246, 0.1);
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

          .balance-owed {
            color: #DC2626 !important;
            font-weight: 700 !important;
          }

          .payment-card {
            background-color: #FEF2F2;
            border: 1px solid #FCA5A5;
            border-left: 4px solid #EF4444;
            padding: 25px 30px;
            margin: 30px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
          }

          .payment-complete {
            background-color: #D1FAE5;
            border: 1px solid #6EE7B7;
            border-left: 4px solid #10B981;
            padding: 25px 30px;
            margin: 30px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
          }

          .payment-title {
            font-family: 'Poppins', 'Inter', sans-serif;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .payment-owed-title {
            color: #DC2626;
          }

          .payment-complete-title {
            color: #059669;
          }

          .feedback-card {
            background-color: #FEF3C7;
            border: 1px solid #F59E0B;
            padding: 30px;
            margin: 30px 0;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
          }

          .feedback-title {
            font-family: 'Poppins', 'Inter', sans-serif;
            font-size: 20px;
            color: #D97706;
            font-weight: 600;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }

          .feedback-subtitle {
            color: #92400E;
            font-size: 16px;
            margin-bottom: 25px;
            line-height: 1.6;
          }

          .feedback-button {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background-color: #F59E0B;
            color: white;
            padding: 14px 35px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
            transition: all 0.3s ease;
          }

          .feedback-button:hover {
            background-color: #D97706;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
          }

          .come-back-card {
            background-color: #E0E7FF;
            border: 1px solid #818CF8;
            padding: 30px;
            margin: 30px 0;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(129, 140, 248, 0.15);
          }

          .come-back-title {
            font-family: 'Poppins', 'Inter', sans-serif;
            font-size: 24px;
            color: #4338CA;
            font-weight: 700;
            margin-bottom: 15px;
          }

          .come-back-subtitle {
            color: #6366F1;
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
            <div class="tagline">Thank You For Staying With Us</div>
            <div class="status-badge">
              <i class="fas fa-sign-out-alt"></i>
              <span>Checked Out</span>
            </div>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="thank-you-message">
              <span>Thank You, ${bookingData.firstName}!</span>
              <i class="fas fa-hands-helping"></i>
            </div>

            <p class="intro-text">
              You have successfully checked out. We hope you enjoyed your stay at <strong>Staycation Haven</strong>!
              We would love to hear about your experience and hope to see you again soon.
            </p>

            <!-- Booking Summary Card -->
            <div class="info-card">
              <div class="card-title">
                <i class="fas fa-clipboard-list"></i>
                <span>Your Stay Summary</span>
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
                <span class="info-value">${bookingData.checkInDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Check-Out</span>
                <span class="info-value">${bookingData.checkOutDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Amount</span>
                <span class="info-value">₱${bookingData.totalAmount}</span>
              </div>
              ${bookingData.remainingBalance > 0 ? `
              <div class="info-row">
                <span class="info-label balance-owed">Remaining Balance</span>
                <span class="info-value balance-owed">₱${bookingData.remainingBalance}</span>
              </div>
              ` : ''}
            </div>

            <!-- Payment Information -->
            ${bookingData.remainingBalance > 0 ? `
            <div class="payment-card">
              <div class="payment-title payment-owed-title">
                <i class="fas fa-credit-card"></i>
                <span>Payment Notice</span>
              </div>
              <p class="intro-text" style="margin: 0; color: #991B1B;">
                You have a remaining balance of <strong style="color: #DC2626;">₱${bookingData.remainingBalance}</strong>.
                Please settle this amount at your earliest convenience.
              </p>
            </div>
            ` : `
            <div class="payment-complete">
              <div class="payment-title payment-complete-title">
                <i class="fas fa-check-circle"></i>
                <span>Payment Complete</span>
              </div>
              <p class="intro-text" style="margin: 0; color: #065F46;">
                All payments have been settled. Thank you for your prompt payment!
              </p>
            </div>
            `}

            <!-- Feedback Request -->
            <div class="feedback-card">
              <div class="feedback-title">
                <i class="fas fa-star"></i>
                <span>Share Your Experience</span>
              </div>
              <p class="feedback-subtitle">
                We would love to hear about your stay! Your feedback helps us improve our service.
              </p>
              <a href="#" class="feedback-button">
                <span>Leave a Review</span>
                <i class="fas fa-arrow-right"></i>
              </a>
            </div>

            <!-- Come Back Message -->
            <div class="come-back-card">
              <div class="come-back-title">
                <i class="fas fa-heart"></i> We Hope to See You Again! <i class="fas fa-heart"></i>
              </div>
              <div class="come-back-subtitle">
                Thank you for choosing Staycation Haven. Safe travels!
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
      subject: `Thank You For Your Stay! - ${bookingData.bookingId}`,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Check-out email sent successfully',
    });
  } catch (error) {
    console.error('Check-out email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send check-out email',
      },
      { status: 500 }
    );
  }
}
