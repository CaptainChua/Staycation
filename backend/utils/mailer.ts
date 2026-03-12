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

// Down Payment Approval Email Template - Agoda-like Design
export function getDownPaymentApprovalEmailTemplate(
  guestName: string,
  bookingId: string,
  downPaymentAmount: string,
  roomName?: string,
  remainingBalance?: string,
  propertyAddress?: string
): string {
  const approvalDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmed - Staycation Haven</title>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Roboto', sans-serif; line-height: 1.5; color: #333; background: #f5f5f5; }
        .wrapper { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: #fff; padding: 20px 30px; border-bottom: 1px solid #eee; text-align: left; }
        .logo { font-size: 20px; font-weight: 700; color: #ff6b35; }
        .content { padding: 30px; }
        .status-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin-bottom: 25px; border-radius: 4px; }
        .status-title { font-size: 16px; font-weight: 700; color: #2e7d32; margin-bottom: 5px; }
        .status-text { font-size: 13px; color: #558b2f; }
        .greeting { font-size: 18px; font-weight: 700; color: #333; margin-bottom: 12px; }
        .intro { font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 25px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 13px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
        .booking-card { background: #f9f9f9; border: 1px solid #eee; border-radius: 4px; padding: 15px; margin-bottom: 15px; }
        .card-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 14px; }
        .card-row:last-child { border-bottom: none; }
        .card-label { color: #999; font-weight: 500; }
        .card-value { font-weight: 600; color: #333; }
        .card-value.amount { color: #ff6b35; font-size: 16px; }
        .card-value.highlight { color: #d32f2f; }
        .property-info { background: #fafafa; border-left: 3px solid #ff6b35; padding: 15px; border-radius: 2px; margin-bottom: 15px; }
        .property-name { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px; }
        .property-address { font-size: 13px; color: #666; line-height: 1.6; }
        .divider { height: 1px; background: #eee; margin: 20px 0; }
        .payment-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .payment-table td { padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; }
        .payment-table td:first-child { color: #666; }
        .payment-table td:last-child { text-align: right; font-weight: 600; color: #333; }
        .payment-table tr:last-child td { border-bottom: none; font-weight: 700; font-size: 15px; }
        .payment-table tr:last-child td:last-child { color: #ff6b35; }
        .cta-box { background: #fff3e0; border-radius: 4px; padding: 20px; text-align: center; margin: 25px 0; }
        .cta-text { font-size: 14px; color: #666; margin-bottom: 15px; line-height: 1.6; }
        .cta-button { display: inline-block; background: #ff6b35; color: white; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px; }
        .cta-button:hover { background: #ff5722; }
        .tips { background: #f0f4f8; border-radius: 4px; padding: 15px; margin: 20px 0; }
        .tips-title { font-size: 13px; font-weight: 700; color: #1565c0; margin-bottom: 10px; }
        .tips-list { list-style: none; }
        .tips-list li { font-size: 13px; color: #555; padding: 6px 0; padding-left: 20px; position: relative; }
        .tips-list li:before { content: '✓'; position: absolute; left: 0; color: #4caf50; font-weight: 700; }
        .footer { background: #f5f5f5; padding: 25px 30px; border-top: 1px solid #eee; text-align: center; }
        .footer-text { font-size: 12px; color: #999; margin: 8px 0; line-height: 1.6; }
        .footer-divider { height: 1px; background: #eee; margin: 15px 0; }
        .footer-copyright { font-size: 11px; color: #bbb; }
        @media (max-width: 600px) {
          .content { padding: 20px; }
          .header { padding: 15px 20px; }
          .card-row { flex-direction: column; }
          .card-value { margin-top: 5px; }
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <!-- Header -->
        <div class="header">
          <div class="logo">🏡 Staycation Haven</div>
        </div>

        <!-- Main Content -->
        <div class="content">
          <!-- Status -->
          <div class="status-box">
            <div class="status-title">✓ Payment Confirmed</div>
            <div class="status-text">Your down payment has been approved</div>
          </div>

          <!-- Greeting -->
          <div class="greeting">Hi ${guestName},</div>
          <p class="intro">
            Great news! Your down payment of <strong>${downPaymentAmount}</strong> has been successfully approved. Your reservation is confirmed, and you're all set to check in.
          </p>

          <!-- Booking Details -->
          <div class="section">
            <div class="section-title">Booking Details</div>
            <div class="booking-card">
              <div class="card-row">
                <span class="card-label">Booking ID</span>
                <span class="card-value">#${bookingId}</span>
              </div>
              ${roomName ? `
              <div class="card-row">
                <span class="card-label">Property</span>
                <span class="card-value">${roomName}</span>
              </div>
              ` : ''}
              <div class="card-row">
                <span class="card-label">Approved On</span>
                <span class="card-value">${approvalDate}</span>
              </div>
            </div>
          </div>

          <!-- Property Location -->
          ${propertyAddress ? `
          <div class="section">
            <div class="section-title">Location</div>
            <div class="property-info">
              <div class="property-address">${propertyAddress}</div>
            </div>
          </div>
          ` : ''}

          <!-- Payment Breakdown -->
          <div class="section">
            <div class="section-title">Payment Breakdown</div>
            <table class="payment-table">
              <tr>
                <td>Down Payment</td>
                <td class="amount">${downPaymentAmount}</td>
              </tr>
              ${remainingBalance ? `
              <tr>
                <td>Remaining Balance</td>
                <td class="highlight">${remainingBalance}</td>
              </tr>
              ` : ''}
              <tr>
                <td>Status</td>
                <td style="color: #4caf50;">Approved</td>
              </tr>
            </table>
          </div>

          <!-- CTA -->
          <div class="cta-box">
            <p class="cta-text">Ready to check in? We'll send you check-in instructions and house rules soon.</p>
            <a href="mailto:staycationhaven9@gmail.com" class="cta-button">Contact Us for Details</a>
          </div>

          <!-- Next Steps -->
          <div class="section">
            <div class="section-title">What's Next</div>
            <div class="tips">
              <div class="tips-title">Important Steps:</div>
              <ul class="tips-list">
                <li>Check your email for check-in instructions</li>
                <li>Review house rules and property guidelines</li>
                <li>Confirm your arrival date (24 hours before)</li>
                ${remainingBalance ? `<li>Complete remaining balance payment before check-in</li>` : ''}
              </ul>
            </div>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 20px; line-height: 1.6;">
            If you have any questions, feel free to reach out to our support team. We're here to help make your stay amazing!
          </p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-text">Staycation Haven</div>
          <div class="footer-text">📧 staycationhaven9@gmail.com | 📱 +63 123 456 7890</div>
          <div class="footer-divider"></div>
          <div class="footer-copyright">
            © ${new Date().getFullYear()} Staycation Haven. All rights reserved. | Experience Your Perfect Staycation
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

// Employee Welcome Email Template
export function getEmployeeWelcomeEmailTemplate(
  employeeName: string,
  email: string,
  password: string,
  role: string,
  loginUrl: string = "https://staycationhavenph.com/admin/login"
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Employee Account Created - Staycation Haven</title>
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

        .role-badge {
          display: inline-block;
          background-color: #DFE7F0;
          color: #1F3A93;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          margin-top: 10px;
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
            <i class="fas fa-briefcase"></i> Staycation Haven
          </div>
          <div class="tagline">Welcome to the Team</div>
          <div class="status-badge">
            <i class="fas fa-check-circle"></i>
            <span>Account Created Successfully</span>
          </div>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="greeting">Dear ${employeeName},</div>

          <p class="intro-text">
            Welcome to <span class="highlight">Staycation Haven</span>! Your employee account has been successfully created. We're excited to have you on board as a member of our team.
          </p>

          <div class="role-badge">
            <i class="fas fa-user-tie"></i> Role: ${role}
          </div>

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
              <span>⚠️ Important Security Notice</span>
            </div>
            <ol>
              <li><strong>Change your password immediately</strong> after your first login</li>
              <li>Use a strong password with at least 8 characters</li>
              <li>Include uppercase, lowercase, numbers, and special characters</li>
              <li>Never share your credentials with anyone</li>
              <li>Contact our IT support if you suspect any unauthorized access</li>
            </ol>
          </div>

          <!-- How to Login -->
          <h2 class="section-title">
            <i class="fas fa-sign-in-alt"></i>
            <span>Getting Started</span>
          </h2>
          <p class="intro-text">
            Follow these steps to access your employee dashboard:
          </p>
          <div class="alert-box" style="background-color: #E0F2FE; border-left-color: #0284C7; color: #075985;">
            <ol style="color: #075985;">
              <li>Click the login button below or go to: <strong>${loginUrl}</strong></li>
              <li>Enter your email address: <strong>${email}</strong></li>
              <li>Enter your temporary password (provided above)</li>
              <li>Once logged in, navigate to your <strong>Profile Settings</strong></li>
              <li>Go to <strong>Security</strong> or <strong>Change Password</strong></li>
              <li>Enter your current password</li>
              <li>Create a new secure password</li>
              <li>Save your changes</li>
            </ol>
          </div>

          <!-- Call to Action -->
          <div class="cta-button">
            <a href="${loginUrl}">
              <span>Login to Your Account</span>
              <i class="fas fa-arrow-right"></i>
            </a>
          </div>

          <!-- Next Steps -->
          <h2 class="section-title">
            <i class="fas fa-tasks"></i>
            <span>Next Steps</span>
          </h2>
          <p class="intro-text">
            After logging in and changing your password:
          </p>
          <ul style="margin-left: 20px; color: #6B7280;">
            <li style="margin: 10px 0;">Complete your full profile information</li>
            <li style="margin: 10px 0;">Review company policies and guidelines</li>
            <li style="margin: 10px 0;">Set up two-factor authentication for extra security</li>
            <li style="margin: 10px 0;">Connect with your team members</li>
            <li style="margin: 10px 0;">Start exploring your dashboard</li>
          </ul>

          <p class="intro-text" style="margin-top: 30px;">
            If you have any questions or need assistance, please don't hesitate to contact our support team at
            <span class="highlight">staycationhaven9@gmail.com</span> or reach out to your department manager.
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
            <span>Staycation Haven Team</span>
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

// Send employee welcome email
export async function sendEmployeeWelcomeEmail(
  email: string,
  fullname: string,
  password: string,
  role: string,
  loginUrl?: string
): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const htmlContent = getEmployeeWelcomeEmailTemplate(
      fullname,
      email,
      password,
      role,
      loginUrl
    );

    const mailOptions = {
      from: `"Staycation Haven" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Staycation Haven - Your Account is Ready",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Employee welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending employee welcome email:", error);
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
