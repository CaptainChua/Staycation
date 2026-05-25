import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { generatePamphletPDF, type RentableItem, type AddOnCategory } from '@/backend/utils/pdfGenerators';
import pool from '@/backend/config/db';

// Pull the platform Owner's contact phone + email for the pamphlet.
// Best-effort — returns nulls when no Owner row exists or the fields are
// empty, in which case the pamphlet shows placeholders instead of breaking
// the email send. Prefers the earliest-hired Owner who has BOTH fields set;
// falls back to whoever has at least the phone, then whoever has at least
// the email, so partial data still wins over the hardcoded default.
async function fetchOwnerContact(): Promise<{ phone: string | null; email: string | null }> {
  try {
    const r = await pool.query(
      `SELECT phone, email FROM employees
        WHERE role = 'Owner'
        ORDER BY
          ((phone IS NOT NULL AND phone <> '')::int
           + (email IS NOT NULL AND email <> '')::int) DESC,
          hire_date ASC NULLS LAST,
          id ASC
        LIMIT 1`,
    );
    const row = r.rows[0];
    return {
      phone: row?.phone && row.phone.trim() ? row.phone.trim() : null,
      email: row?.email && row.email.trim() ? row.email.trim() : null,
    };
  } catch {
    return { phone: null, email: null };
  }
}

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();
    const rentableItems: RentableItem[] = bookingData.rentableItems || [];
    const addonCategories: AddOnCategory[] = bookingData.addonCategories || [];
    const ownerContact = await fetchOwnerContact();

    // Generate pamphlet PDF with the room's add-ons (grouped by category if provided)
    const pamphletBuffer = await generatePamphletPDF({
      guestName: `${bookingData.firstName} ${bookingData.lastName || ''}`.trim(),
      roomName: bookingData.roomName || '',
      checkInDate: bookingData.checkInDate || '',
      checkOutDate: bookingData.checkOutDate || '',
      bookingId: bookingData.bookingId || '',
      rentableItems,
      categories: addonCategories,
      contactPhone: ownerContact.phone ?? undefined,
      contactEmail: ownerContact.email ?? undefined,
    });

    // Create transporter
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
        <title>Booking Pending Approval - Staycation Haven</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1F2937; background-color: #F9F6F0; padding: 20px; min-height: 100vh; }
          .email-container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(184, 134, 11, 0.1); border: 1px solid rgba(184, 134, 11, 0.1); }
          .header { background-color: #6B7280; color: #ffffff; padding: 40px 30px; text-align: center; }
          .logo { font-family: 'Poppins', 'Inter', sans-serif; font-size: 32px; font-weight: 700; margin-bottom: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .tagline { font-size: 16px; font-weight: 400; opacity: 0.95; margin-bottom: 20px; }
          .status-badge { background-color: rgba(255,255,255,0.2); color: white; padding: 8px 20px; border-radius: 20px; display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; border: 1px solid rgba(255,255,255,0.3); }
          .content { padding: 40px 35px; background: #ffffff; }
          .greeting { font-size: 24px; color: #1F2937; margin-bottom: 16px; font-weight: 600; }
          .intro-text { color: #6B7280; margin-bottom: 30px; line-height: 1.7; font-size: 16px; }
          .section-title { font-family: 'Poppins', 'Inter', sans-serif; font-size: 18px; color: #8B6508; font-weight: 600; margin: 30px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #F5DEB3; display: flex; align-items: center; gap: 10px; }
          .info-card { background-color: #F9F6F0; border-left: 4px solid #8B6508; padding: 25px 30px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(184,134,11,0.08); }
          .info-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(184,134,11,0.1); }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: 600; color: #8B6508; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-value { color: #1F2937; font-weight: 500; font-size: 15px; text-align: right; }
          .price-summary { background-color: #4A2C2A; color: #F9F6F0; padding: 30px 25px; border-radius: 8px; margin: 30px 0; text-align: center; }
          .price-row { display: flex; justify-content: space-between; align-items: center; margin: 12px 0; font-size: 16px; }
          .price-total { margin-top: 20px; padding-top: 20px; border-top: 2px solid rgba(184,134,11,0.3); font-size: 24px; font-weight: 700; color: #B8860B; }
          .alert-box { background-color: #FFFFFF; border: 1px solid #F2EBD9; border-left: 4px solid #8B6508; padding: 25px 30px; margin: 30px 0; border-radius: 8px; }
          .alert-title { font-weight: 700; color: #8B6508; margin-bottom: 15px; font-size: 16px; display: flex; align-items: center; gap: 8px; }
          .alert-box ul { margin-left: 20px; color: #5D4037; }
          .alert-box li { margin: 10px 0; line-height: 1.6; position: relative; padding-left: 8px; }
          .alert-box li::before { content: '•'; position: absolute; left: -8px; color: #8B6508; font-weight: bold; }
          .cta-button { text-align: center; margin: 40px 0; }
          .cta-button a { display: inline-flex; align-items: center; gap: 10px; background-color: #8B6508; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
          .footer { background-color: #1F2937; color: #D1D5DB; padding: 35px 30px; text-align: center; }
          .footer-info { margin: 10px 0; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; }
          .footer-divider { height: 1px; background-color: #374151; margin: 20px 0; }
          .footer-copyright { font-size: 13px; color: #9CA3AF; margin-top: 15px; }
          .highlight { color: #8B6508; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo"><i class="fas fa-umbrella-beach"></i> Staycation Haven</div>
            <div class="tagline">Your Perfect Getaway Awaits</div>
            <div class="status-badge"><i class="fas fa-clock"></i><span>Pending Approval</span></div>
          </div>

          <div class="content">
            <div class="greeting">Dear ${bookingData.firstName} ${bookingData.lastName},</div>
            <p class="intro-text">
              Thank you for choosing <span class="highlight">Staycation Haven</span>! We have received your booking request
              and it is currently pending approval from our team. We will review your booking
              and get back to you within 24 hours.
            </p>

            <h2 class="section-title"><i class="fas fa-clipboard-list"></i><span>Booking Information</span></h2>
            <div class="info-card">
              <div class="info-row"><span class="info-label">Booking ID</span><span class="info-value">${bookingData.bookingId}</span></div>
              <div class="info-row"><span class="info-label">Room Type</span><span class="info-value">${bookingData.roomName}</span></div>
            </div>

            <h2 class="section-title"><i class="fas fa-calendar-alt"></i><span>Stay Details</span></h2>
            <div class="info-card">
              <div class="info-row"><span class="info-label">Check-in Date</span><span class="info-value">${bookingData.checkInDate}</span></div>
              <div class="info-row"><span class="info-label">Check-in Time</span><span class="info-value">${bookingData.checkInTime}</span></div>
              <div class="info-row"><span class="info-label">Check-out Date</span><span class="info-value">${bookingData.checkOutDate}</span></div>
              <div class="info-row"><span class="info-label">Check-out Time</span><span class="info-value">${bookingData.checkOutTime}</span></div>
              <div class="info-row"><span class="info-label">Number of Guests</span><span class="info-value">${bookingData.guests}</span></div>
            </div>

            <h2 class="section-title"><i class="fas fa-credit-card"></i><span>Payment Summary</span></h2>
            <div class="price-summary">
              <div class="price-row"><span>Payment Method:</span><span>${bookingData.paymentMethod === 'gcash' ? 'GCash' : bookingData.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : bookingData.paymentMethod}</span></div>
              <div class="price-row"><span>Down Payment:</span><span>₱${Number(bookingData.downPayment).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div class="price-total">
                <div class="price-row"><span>Total Amount:</span><span>₱${Number(bookingData.totalAmount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              </div>
            </div>

            <div class="alert-box" style="background-color:#FEF3C7;border-left-color:#F59E0B;">
              <div class="alert-title" style="color:#D97706;"><i class="fas fa-file-pdf"></i><span>Pamphlet Attached</span></div>
              <ul>
                <li>A rentable items guide for your room is attached to this email</li>
                <li>Browse optional add-ons you can request during your stay</li>
                <li>Contact the front desk to arrange any items you'd like</li>
              </ul>
            </div>

            <div class="alert-box">
              <div class="alert-title"><i class="fas fa-sync-alt"></i><span>What Happens Next?</span></div>
              <ul>
                <li>Our team will review your booking request and payment proof</li>
                <li>You will receive a confirmation email once your booking is approved</li>
                <li>This usually takes 12-24 hours during business days</li>
                <li>If you have any questions, feel free to contact us</li>
              </ul>
            </div>

            <p class="intro-text" style="margin-top:30px;">
              Thank you for your patience! We're excited to host you at <span class="highlight">Staycation Haven</span>.
            </p>

            <div class="cta-button">
              <a href="http://localhost:3000"><span>Visit Our Website</span><i class="fas fa-arrow-right"></i></a>
            </div>
          </div>

          <div class="footer">
            <div class="footer-info"><i class="fas fa-envelope"></i><span>staycationhaven9@gmail.com</span></div>
            <div class="footer-info"><i class="fas fa-phone"></i><span>+63 123 456 7890</span></div>
            <div class="footer-info"><i class="fas fa-map-marker-alt"></i><span>Your Perfect Destination</span></div>
            <div class="footer-divider"></div>
            <div class="footer-copyright">&copy; ${new Date().getFullYear()} Staycation Haven. All rights reserved.</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Staycation Haven" <${process.env.EMAIL_USER}>`,
      to: bookingData.email,
      subject: `Booking Pending Approval - ${bookingData.bookingId}`,
      html: emailHtml,
      attachments: [
        {
          filename: `Staycation-Pamphlet-${bookingData.bookingId}.pdf`,
          content: pamphletBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Pending email sent successfully' });

  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
}
