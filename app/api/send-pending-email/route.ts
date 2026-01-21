import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();

    // Create transporter with your Gmail credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email HTML template for PENDING status
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Pending Approval</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #4A2C2A;
            background-color: #F9F6F0;
            padding: 20px;
          }

          .email-container {
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(74, 44, 42, 0.08);
            border: 1px solid rgba(197, 160, 89, 0.2);
          }

          .header {
            background: #B8860B;
            color: #ffffff;
            padding: 45px 30px;
            text-align: center;
            border-bottom: 4px solid #4A2C2A;
          }

          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: 1px;
            text-transform: uppercase;
          }

          .header p {
            font-size: 14px;
            opacity: 0.9;
            letter-spacing: 0.5px;
            color: #F2EBD9;
          }

          .status-badge {
            background: #6B7280;
            color: #FFFFFF;
            padding: 8px 24px;
            border-radius: 4px;
            display: inline-block;
            font-size: 12px;
            font-weight: 700;
            margin-top: 25px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .content {
            padding: 40px 35px;
            background: #FFFFFF;
          }

          .greeting {
            font-size: 20px;
            color: #4A2C2A;
            margin-bottom: 20px;
            font-weight: 700;
          }

          .intro-text {
            color: #5D4037;
            margin-bottom: 30px;
            line-height: 1.8;
          }

          .section-title {
            font-size: 15px;
            color: #B8860B;
            font-weight: 700;
            margin: 35px 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #F2EBD9;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .info-card {
            background: #F9F6F0;
            border-left: 4px solid #B8860B;
            padding: 25px;
            margin: 15px 0;
            border-radius: 4px;
          }

          .info-row {
            display: table;
            width: 100%;
            padding: 10px 0;
            border-bottom: 1px solid rgba(74, 44, 42, 0.05);
          }

          .info-row:last-child {
            border-bottom: none;
          }

          .info-label {
            display: table-cell;
            font-weight: 700;
            color: #B8860B;
            width: 40%;
            padding-right: 15px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .info-value {
            display: table-cell;
            color: #4A2C2A;
            font-weight: 500;
          }

          .price-summary {
            background: #4A2C2A;
            color: #F9F6F0;
            padding: 30px;
            border-radius: 4px;
            margin: 30px 0;
            text-align: center;
            border: 1px solid #B8860B;
          }

          .price-row {
            display: flex;
            justify-content: space-between;
            margin: 12px 0;
            font-size: 15px;
            opacity: 0.9;
          }

          .price-total {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(184, 134, 11, 0.3);
            font-size: 26px;
            font-weight: 700;
            color: #B8860B;
          }

          .alert-box {
            background: #FFFFFF;
            border: 1px solid #F2EBD9;
            padding: 25px;
            margin: 30px 0;
            border-radius: 4px;
          }

          .alert-title {
            font-weight: 700;
            color: #B8860B;
            margin-bottom: 15px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .alert-box ul {
            margin-left: 20px;
            color: #5D4037;
          }

          .alert-box li {
            margin: 10px 0;
            line-height: 1.6;
          }

          .cta-button {
            text-align: center;
            margin: 40px 0;
          }

          .cta-button a {
            display: inline-block;
            background: #B8860B;
            color: #FFFFFF;
            padding: 16px 45px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 700;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s ease;
          }

          .footer {
            background: #F2EBD9;
            color: #5D4037;
            padding: 40px;
            text-align: center;
            border-top: 1px solid #B8860B;
          }

          .footer-info {
            margin: 10px 0;
            font-size: 14px;
          }

          .footer-divider {
            height: 1px;
            background: #B8860B;
            opacity: 0.2;
            margin: 25px 0;
          }

          .footer-copyright {
            font-size: 12px;
            color: #8D6E63;
            margin-top: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          @media only screen and (max-width: 600px) {
            .email-container {
              border-radius: 0;
            }

            .header {
              padding: 30px 20px;
            }

            .content {
              padding: 30px 20px;
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
            <h1>Staycation Haven</h1>
            <p>Your Perfect Getaway Awaits</p>
            <span class="status-badge">Pending Approval</span>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="greeting">Dear ${bookingData.firstName} ${bookingData.lastName},</div>

            <p class="intro-text">
              Thank you for choosing Staycation Haven! We have received your booking request
              and it is currently pending approval from our team. We will review your booking
              and get back to you within 24 hours.
            </p>

            <!-- Booking Information -->
            <h2 class="section-title">Booking Information</h2>
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
            <h2 class="section-title">Stay Details</h2>
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
            <h2 class="section-title">Payment Summary</h2>
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
              <div class="alert-title">What Happens Next?</div>
              <ul>
                <li>Our team will review your booking request and payment proof</li>
                <li>You will receive a confirmation email once your booking is approved</li>
                <li>This usually takes 12-24 hours during business days</li>
                <li>Keep this email for your records</li>
                <li>If you have any questions, feel free to contact us</li>
                <li>Please ensure your payment proof is clear and complete</li>
              </ul>
            </div>

            <p class="intro-text" style="margin-top: 25px;">
              Thank you for your patience! We're excited to host you at Staycation Haven.
              If you have any urgent concerns or questions about your booking, please don't
              hesitate to reach out to us directly.
            </p>

            <!-- Call to Action -->
            <div class="cta-button">
              <a href="http://localhost:3000">Visit Our Website</a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-info">
              <strong>Email:</strong> staycationhaven9@gmail.com
            </div>
            <div class="footer-info">
              <strong>Phone:</strong> +63 123 456 7890
            </div>
            <div class="footer-info">
              <strong>Address:</strong> Your Perfect Destination
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
      subject: `Booking Pending Approval - ${bookingData.bookingId}`,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Pending email sent successfully'
    });

  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
