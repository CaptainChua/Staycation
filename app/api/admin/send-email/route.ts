import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Create transporter with Gmail credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your-email@gmail.com
    pass: process.env.EMAIL_PASSWORD, // your Gmail App Password
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, type, userName } = body;

    if (!email || !otp || !type) {
      return NextResponse.json({
        success: false,
        error: "Email, OTP, and type are required",
      }, { status: 400 });
    }

    // Create beautiful HTML email template
    const htmlContent = createEmailTemplate(email, otp, type, userName);

    // Send email using nodemailer
    const mailOptions = {
      from: `"Staycation Haven" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: type === 'ACCOUNT_LOCK' ? '🔒 Account Locked - Security Alert' : '🔐 Verification Code',
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent successfully to ${email}`);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });

  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to send email",
    }, { status: 500 });
  }
}

function createEmailTemplate(email: string, otp: string, type: string, userName?: string) {
  const isAccountLock = type === 'ACCOUNT_LOCK';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isAccountLock ? 'Account Locked' : 'Verification Code'}</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #1F2937;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #F9F6F0;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(184, 134, 11, 0.1);
          overflow: hidden;
          border: 1px solid rgba(184, 134, 11, 0.1);
        }
        .header {
          background: #B8860B;
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 24px;
        }
        .brand-name {
          font-family: 'Poppins', sans-serif;
          font-size: 24px;
          font-weight: 600;
          margin: 10px 0;
        }
        .content {
          padding: 40px 30px;
        }
        .otp-container {
          background: #F9F6F0;
          border: 2px dashed #B8860B;
          border-radius: 8px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #B8860B;
          margin: 15px 0;
          font-family: 'Poppins', sans-serif;
        }
        .security-info {
          background: #FEF3C7;
          border-left: 4px solid #B8860B;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          background: #F9F6F0;
          padding: 20px 30px;
          text-align: center;
          color: #6B7280;
          font-size: 14px;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background: #B8860B;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
          transition: background-color 0.3s ease;
        }
        .btn:hover {
          background: #9B7408;
        }
        .text-primary {
          color: #B8860B;
        }
        .title {
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            ${isAccountLock ? 
              '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg>' : 
              '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"></path><path d="M21 12c-1.39 0-2.78-.35-4-1a8 8 0 00-8 0c-1.22.65-2.61 1-4 1H2"></path><path d="M22 12v5a2 2 0 01-2 2H4a2 2 0 01-2-2v-5"></path></svg>'
            }
          </div>
          <div class="brand-name">Staycation Haven</div>
          <h1>${isAccountLock ? 'Account Security Alert' : 'Verify Your Account'}</h1>
          <p>${isAccountLock ? 'We detected unusual activity on your account' : 'Complete your verification'}</p>
        </div>
        
        <div class="content">
          ${userName ? `<p>Hello <strong class="text-primary">${userName}</strong>,</p>` : ''}
          
          ${isAccountLock ? `
            <p class="title">Account Temporarily Locked</p>
            <p>We've temporarily locked your account due to multiple failed login attempts. This is to protect your account from unauthorized access.</p>
          ` : `
            <p class="title">Verify Your Account</p>
            <p>Thank you for using our service. To complete your action, please use the verification code below:</p>
          `}
          
          <div class="otp-container">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #1F2937;">
              ${isAccountLock ? 'Account Unlock Code' : 'Verification Code'}
            </p>
            <div class="otp-code">${otp}</div>
            <p style="margin: 15px 0 0 0; font-size: 14px; color: #6B7280;">
              This code will expire in <strong>10 minutes</strong>
            </p>
          </div>
          
          <div class="security-info">
            <strong>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 5px;">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Security Tips:
            </strong>
            <ul style="margin: 10px 0 0 20px; padding-left: 20px;">
              <li>Never share this code with anyone</li>
              <li>We'll never ask for your password via email</li>
              <li>This code is single-use only</li>
            </ul>
          </div>
          
          <p style="margin: 30px 0 20px 0; color: #6B7280;">
            If you didn't request this code, please ignore this email or contact our support team immediately.
          </p>
          
          <p style="margin: 0; color: #6B7280;">
            Best regards,<br>
            <strong class="text-primary">Staycation Haven Security Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">
            This email was sent to <strong>${email}</strong><br>
            © ${new Date().getFullYear()} Staycation Haven. All rights reserved.<br>
            <span style="font-size: 12px;">Your Perfect Getaway Destination</span>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
