import nodemailer from "nodemailer";

// Partner Welcome Email Template matching the existing booking email style
export function getPartnerWelcomeEmailTemplate(
  partnerName: string,
  email: string,
  password: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Partner Account Created - Staycation Haven</title>
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
          margin-top: 15px;
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

        .credentials-box {
          background-color: #F9F6F0;
          border-left: 4px solid #B8860B;
          padding: 25px 30px;
          margin: 20px 0;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(184, 134, 11, 0.08);
        }

        .credential-row {
          padding: 12px 0;
          border-bottom: 1px solid rgba(184, 134, 11, 0.1);
        }

        .credential-row:last-child {
          border-bottom: none;
        }

        .credential-label {
          font-weight: 600;
          color: #8B6508;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 8px;
        }

        .credential-value {
          color: #1F2937;
          font-weight: 500;
          font-size: 15px;
          font-family: 'Courier New', monospace;
          background-color: white;
          padding: 12px;
          border-radius: 6px;
          word-break: break-all;
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

        .alert-box ol {
          margin-left: 20px;
          color: #78350F;
        }

        .alert-box li {
          margin: 12px 0;
          line-height: 1.8;
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
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <div class="logo">
            <i class="fas fa-handshake"></i> Staycation Haven
          </div>
          <div class="tagline">Your Perfect Partnership Begins Here</div>
          <div class="status-badge">
            <i class="fas fa-check-circle"></i>
            <span>Account Created Successfully</span>
          </div>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="greeting">Dear ${partnerName},</div>

          <p class="intro-text">
            Welcome to the <span class="highlight">Staycation Haven Partner Network</span>!
            Your partner account has been successfully created. We're excited to have you join our growing community of premium hospitality partners.
          </p>

          <!-- Credentials -->
          <h2 class="section-title">
            <i class="fas fa-lock"></i>
            <span>Your Login Credentials</span>
          </h2>
          <div class="credentials-box">
            <div class="credential-row">
              <span class="credential-label">Email Address</span>
              <div class="credential-value">${email}</div>
            </div>
            <div class="credential-row">
              <span class="credential-label">Temporary Password</span>
              <div class="credential-value">${password}</div>
            </div>
          </div>

          <!-- Security Alert -->
          <div class="alert-box">
            <div class="alert-title">
              <i class="fas fa-exclamation-triangle"></i>
              <span>Important Security Information</span>
            </div>
            <ol>
              <li><strong>Change your password immediately</strong> after your first login</li>
              <li>Use a strong password with at least 8 characters</li>
              <li>Include uppercase, lowercase, numbers, and special characters</li>
              <li>Never share your credentials with anyone</li>
              <li>Contact our support team if you suspect any unauthorized access</li>
            </ol>
          </div>

          <!-- How to Change Password -->
          <h2 class="section-title">
            <i class="fas fa-key"></i>
            <span>How to Change Your Password</span>
          </h2>
          <div class="alert-box" style="background-color: #E0F2FE; border-left-color: #0284C7; color: #075985;">
            <ol style="color: #075985;">
              <li>Log in to your partner dashboard using the credentials above</li>
              <li>Click your <strong>Profile Icon</strong> in the top-right corner</li>
              <li>Select <strong>"Settings"</strong> from the dropdown menu</li>
              <li>Go to <strong>"Security"</strong> or <strong>"Change Password"</strong></li>
              <li>Enter your current password (the temporary one provided)</li>
              <li>Enter your new secure password</li>
              <li>Click <strong>"Save Changes"</strong> or <strong>"Update Password"</strong></li>
              <li>Log in again with your new password</li>
            </ol>
          </div>

          <!-- Next Steps -->
          <h2 class="section-title">
            <i class="fas fa-tasks"></i>
            <span>Next Steps</span>
          </h2>
          <p class="intro-text">
            To get started with your partner dashboard, please:
          </p>
          <ul style="margin-left: 20px; color: #6B7280;">
            <li style="margin: 10px 0;">Complete your full profile information</li>
            <li style="margin: 10px 0;">Set up your commission rates and payment details</li>
            <li style="margin: 10px 0;">Configure your property information and availability</li>
            <li style="margin: 10px 0;">Review the partner guidelines and policies</li>
            <li style="margin: 10px 0;">Start managing your services on the platform</li>
          </ul>

          <!-- Call to Action -->
          <div class="cta-button">
            <a href="https://staycation-haven.com/partner/login">
              <span>Access Partner Dashboard</span>
              <i class="fas fa-arrow-right"></i>
            </a>
          </div>

          <p class="intro-text">
            If you have any questions or need assistance, our dedicated support team is available to help.
            You can reach us through the Help & Support section in your dashboard or contact us directly at
            <span class="highlight">staycationhaven9@gmail.com</span>
          </p>
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
            <span>Your Perfect Partnership Destination</span>
          </div>

          <div class="footer-divider"></div>

          <div class="footer-copyright">
            &copy; ${new Date().getFullYear()} Staycation Haven. All rights reserved. |
            <a href="#" style="color: #9CA3AF; text-decoration: none;">Privacy Policy</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Down Payment Approval Email Template
export function getDownPaymentApprovalEmailTemplate(
  guestName: string,
  bookingId: string,
  downPaymentAmount: string,
  roomName?: string,
  remainingBalance?: string,
  propertyAddress?: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Down Payment Approved - Staycation Haven</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', sans-serif;
          line-height: 1.6;
          color: #374151;
          background: #fafafa;
          padding: 20px;
        }

        .wrapper {
          max-width: 650px;
          margin: 0 auto;
        }

        .email-container {
          background: white;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .hero {
          background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
          color: white;
          padding: 50px 40px;
          text-align: center;
          position: relative;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 300px;
          height: 300px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          transform: translate(100px, -100px);
        }

        .hero-content {
          position: relative;
          z-index: 1;
        }

        .badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .hero h1 {
          font-family: 'Poppins', sans-serif;
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -1px;
        }

        .hero p {
          font-size: 16px;
          opacity: 0.95;
          margin: 0;
        }

        .content {
          padding: 45px 40px;
        }

        .greeting {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 20px;
        }

        .intro-text {
          color: #6B7280;
          font-size: 15px;
          line-height: 1.8;
          margin-bottom: 32px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 28px;
        }

        .info-box {
          background: linear-gradient(135deg, #FFF8F3 0%, #FFFBF8 100%);
          border: 1px solid #FECACA;
          border-radius: 10px;
          padding: 18px;
        }

        .info-box.accent {
          background: linear-gradient(135deg, #FFF5F0 0%, #FFF9F7 100%);
          border-color: #FDBAA1;
        }

        .info-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #D97706;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .info-value {
          font-size: 16px;
          font-weight: 700;
          color: #1F2937;
        }

        .info-value.amount {
          color: #F97316;
          font-size: 18px;
        }

        .separator {
          height: 1px;
          background: #E5E7EB;
          margin: 32px 0;
        }

        .section-title {
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-icon {
          font-size: 18px;
        }

        .property-box {
          background: #F3F4F6;
          border-left: 4px solid #F97316;
          padding: 18px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .property-address {
          font-size: 14px;
          line-height: 1.7;
          color: #4B5563;
          font-weight: 500;
        }

        .payment-summary {
          background: #FAFAFA;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .payment-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #E5E7EB;
        }

        .payment-row:last-child {
          border-bottom: none;
        }

        .payment-label {
          font-size: 14px;
          color: #6B7280;
          font-weight: 500;
        }

        .payment-value {
          font-size: 15px;
          font-weight: 700;
          color: #1F2937;
        }

        .payment-value.highlight {
          color: #F97316;
          font-size: 16px;
        }

        .payment-value.pending {
          color: #DC2626;
        }

        .action-box {
          background: linear-gradient(135deg, #FEF3C7 0%, #FEFCE8 100%);
          border: 1px solid #FDE047;
          border-radius: 10px;
          padding: 24px;
          margin-bottom: 24px;
          text-align: center;
        }

        .action-title {
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #92400E;
          margin-bottom: 12px;
        }

        .action-text {
          font-size: 14px;
          color: #78350F;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
          color: white;
          padding: 12px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          transition: transform 0.2s;
        }

        .cta-button:hover {
          transform: translateY(-2px);
        }

        .next-steps {
          background: #F0F9FF;
          border-left: 4px solid #3B82F6;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .next-steps-title {
          font-weight: 700;
          color: #1E40AF;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .next-steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .next-steps-list li {
          font-size: 13px;
          color: #1E3A8A;
          margin: 8px 0;
          padding-left: 20px;
          position: relative;
        }

        .next-steps-list li:before {
          content: '→';
          position: absolute;
          left: 0;
          font-weight: 700;
        }

        .closing {
          color: #6B7280;
          font-size: 14px;
          line-height: 1.7;
          text-align: center;
          margin-bottom: 8px;
        }

        .footer {
          background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
          color: #D1D5DB;
          padding: 35px 40px;
          text-align: center;
          border-top: 1px solid #374151;
        }

        .footer-logo {
          font-family: 'Poppins', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: white;
          margin-bottom: 16px;
        }

        .footer-text {
          font-size: 13px;
          line-height: 1.8;
          margin: 10px 0;
        }

        .footer-divider {
          height: 1px;
          background: #4B5563;
          margin: 16px 0;
        }

        .footer-copyright {
          font-size: 12px;
          color: #9CA3AF;
        }

        @media only screen and (max-width: 600px) {
          .content {
            padding: 30px 20px;
          }
          .hero {
            padding: 35px 20px;
          }
          .hero h1 {
            font-size: 28px;
          }
          .info-grid {
            grid-template-columns: 1fr;
          }
          .payment-summary {
            padding: 16px;
          }
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="email-container">
          <!-- Hero Section -->
          <div class="hero">
            <div class="hero-content">
              <div class="badge">✓ Payment Confirmed</div>
              <h1>Down Payment Approved</h1>
              <p>Your booking is now secured</p>
            </div>
          </div>

          <!-- Main Content -->
          <div class="content">
            <div class="greeting">Hello ${guestName},</div>

            <p class="intro-text">
              We're delighted to inform you that we have successfully approved the <strong>down payment</strong> for your upcoming stay at <strong>Staycation Haven</strong>. Your booking is now confirmed and you're all set to check in!
            </p>

            <!-- Key Info Grid -->
            <div class="info-grid">
              <div class="info-box">
                <div class="info-label">Booking ID</div>
                <div class="info-value">#${bookingId}</div>
              </div>
              <div class="info-box accent">
                <div class="info-label">Down Payment</div>
                <div class="info-value amount">${downPaymentAmount}</div>
              </div>
            </div>

            <div class="separator"></div>

            <!-- Property Information -->
            <div class="section-title">
              <span class="section-icon">📍</span>
              Your Haven Location
            </div>
            <div class="property-box">
              <div class="property-address">
                ${propertyAddress || 'M Place South Triangle Tower D, Panay Ave, Diliman, Quezon City, 1103 Metro Manila'}
              </div>
            </div>

            ${roomName ? `
            <div class="info-grid" style="margin-bottom: 24px;">
              <div class="info-box">
                <div class="info-label">Room/Haven</div>
                <div class="info-value">${roomName}</div>
              </div>
              <div class="info-box">
                <div class="info-label">Approval Date</div>
                <div class="info-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            </div>
            ` : `
            <div class="info-box" style="margin-bottom: 24px;">
              <div class="info-label">Approval Date</div>
              <div class="info-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            `}

            <!-- Payment Summary -->
            <div class="section-title">
              <span class="section-icon">💳</span>
              Payment Summary
            </div>
            <div class="payment-summary">
              <div class="payment-row">
                <span class="payment-label">Down Payment</span>
                <span class="payment-value highlight">${downPaymentAmount}</span>
              </div>
              ${remainingBalance ? `
              <div class="payment-row">
                <span class="payment-label">Remaining Balance</span>
                <span class="payment-value pending">${remainingBalance}</span>
              </div>
              ` : ''}
              <div class="payment-row">
                <span class="payment-label">Status</span>
                <span class="payment-value" style="color: #059669;">Approved ✓</span>
              </div>
            </div>

            <!-- Action Box -->
            <div class="action-box">
              <div class="action-title">🎉 Ready to Check In?</div>
              <div class="action-text">
                Your approved down payment confirms your reservation. You can now proceed with your check-in on your scheduled date. We'll send you detailed check-in instructions soon!
              </div>
              <a href="mailto:staycationhaven9@gmail.com" class="cta-button">Contact Us</a>
            </div>

            <!-- Next Steps -->
            <div class="section-title">
              <span class="section-icon">📋</span>
              What Happens Next
            </div>
            <div class="next-steps">
              <div class="next-steps-title">Important Steps to Follow:</div>
              <ul class="next-steps-list">
                <li>You will receive detailed check-in instructions via email</li>
                <li>Please review the property guidelines and house rules</li>
                <li>Confirm your arrival time at least 24 hours before check-in</li>
                ${remainingBalance ? `<li>Complete the remaining balance payment before check-in date</li>` : ''}
                <li>Save this email for your reference</li>
              </ul>
            </div>

            <p class="closing">
              If you have any questions or concerns, don't hesitate to reach out to our team. We're here to help!
            </p>

            <p class="closing">
              <strong>Warm regards,</strong><br>
              <strong>The Staycation Haven Team</strong>
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-logo">🏡 Staycation Haven</div>
            <div class="footer-text">
              📧 staycationhaven9@gmail.com<br>
              📱 +63 123 456 7890
            </div>
            <div class="footer-divider"></div>
            <div class="footer-copyright">
              &copy; ${new Date().getFullYear()} Staycation Haven. All rights reserved.<br>
              Experience Your Perfect Staycation
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send down payment approval email to guest
export async function sendDownPaymentApprovalEmail(
  email: string,
  guestName: string,
  bookingId: string,
  downPaymentAmount: string,
  roomName?: string,
  remainingBalance?: string,
  propertyAddress?: string
): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const htmlContent = getDownPaymentApprovalEmailTemplate(
      guestName,
      bookingId,
      downPaymentAmount,
      roomName,
      remainingBalance,
      propertyAddress
    );

    const mailOptions = {
      from: `"Staycation Haven" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Down Payment Approved - Your Booking is Confirmed",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Down payment approval email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending down payment approval email:", error);
    return false;
  }
}

// Send partner welcome email using the same setup as booking emails
export async function sendPartnerWelcomeEmail(
  email: string,
  fullname: string,
  password: string
): Promise<boolean> {
  try {
    // Create transporter with the same setup as other emails
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const htmlContent = getPartnerWelcomeEmailTemplate(fullname, email, password);

    const mailOptions = {
      from: `"Staycation Haven" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Partner Account Created - Welcome to Staycation Haven",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Partner welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending partner welcome email:", error);
    return false;
  }
}
