import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

// Generate PDF receipt
async function generateReceiptPDF(bookingData: Record<string, unknown>): Promise<Buffer> {
  const qrCodeDataURL = await QRCode.toDataURL(bookingData.bookingId as string, {
    width: 300,
    margin: 1,
    color: { dark: '#B8860B', light: '#FFFFFF' }
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Colors
  const primaryColor: [number, number, number] = [184, 134, 11];
  const primaryDark: [number, number, number] = [139, 101, 8];
  const primarySoft: [number, number, number] = [245, 222, 179];
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [33, 33, 33];
  const gray: [number, number, number] = [107, 114, 128];
  const lightGray: [number, number, number] = [249, 250, 251];
  const green: [number, number, number] = [34, 139, 34];
  const red: [number, number, number] = [220, 53, 69];

  let yPos = margin;

  // Header
  pdf.setFillColor(...primaryColor);
  pdf.rect(0, 0, pageWidth, 60, 'F');
  pdf.setTextColor(...white);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('STAYCATION', margin, 16);
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Haven', margin, 28);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Your Perfect Getaway Awaits', margin, 38);

  // QR Code
  if (qrCodeDataURL) {
    const qrSize = 32;
    const qrX = pageWidth - margin - qrSize;
    const qrY = 8;
    pdf.setFillColor(...white);
    pdf.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6, 2, 2, 'F');
    pdf.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize);
    pdf.setTextColor(...white);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SCAN FOR CHECK-IN', qrX + qrSize/2, qrY + qrSize + 8, { align: 'center' });
  }

  // Receipt badge
  pdf.setFillColor(...white);
  pdf.roundedRect(margin, 48, 45, 14, 2, 2, 'F');
  pdf.setTextColor(...primaryColor);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('OFFICIAL RECEIPT', margin + 22.5, 57, { align: 'center' });

  yPos = 72;

  // Receipt info bar
  pdf.setFillColor(...lightGray);
  pdf.rect(margin, yPos, contentWidth, 10, 'F');
  pdf.setTextColor(...gray);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Receipt #: ${bookingData.bookingId}`, margin + 4, yPos + 7);
  pdf.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - margin - 4, yPos + 7, { align: 'right' });

  yPos += 18;

  // Guest Information
  pdf.setTextColor(...primaryDark);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GUEST INFORMATION', margin, yPos);
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.4);
  pdf.line(margin, yPos + 1.5, margin + 40, yPos + 1.5);

  yPos += 10;
  const col1X = margin;
  const col2X = pageWidth / 2 + 5;

  pdf.setTextColor(...gray);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Guest Name', col1X, yPos);
  pdf.setTextColor(...black);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${bookingData.firstName} ${bookingData.lastName || ''}`, col1X, yPos + 5);

  pdf.setTextColor(...gray);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Email Address', col2X, yPos);
  pdf.setTextColor(...black);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text((bookingData.email as string) || 'N/A', col2X, yPos + 5);

  yPos += 14;

  pdf.setTextColor(...gray);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Phone Number', col1X, yPos);
  pdf.setTextColor(...black);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text((bookingData.phone as string) || 'N/A', col1X, yPos + 5);

  pdf.setTextColor(...gray);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Number of Guests', col2X, yPos);
  pdf.setTextColor(...black);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text((bookingData.guests as string) || 'N/A', col2X, yPos + 5);

  yPos += 16;

  // Booking Details
  pdf.setTextColor(...primaryDark);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BOOKING DETAILS', margin, yPos);
  pdf.setDrawColor(...primaryColor);
  pdf.line(margin, yPos + 1.5, margin + 38, yPos + 1.5);

  yPos += 8;

  pdf.setFillColor(...primarySoft);
  pdf.roundedRect(margin, yPos, contentWidth, 32, 2, 2, 'F');

  const cardPadding = 6;
  const cardY = yPos + cardPadding;

  pdf.setTextColor(...primaryDark);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ROOM', margin + cardPadding, cardY + 2);
  pdf.setTextColor(...black);
  pdf.setFontSize(11);
  pdf.text((bookingData.roomName as string) || 'N/A', margin + cardPadding, cardY + 9);

  if (bookingData.stayType) {
    pdf.setTextColor(...gray);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(bookingData.stayType as string, margin + cardPadding, cardY + 15);
  }

  const dividerX = margin + contentWidth/3;
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.2);
  pdf.line(dividerX, yPos + 4, dividerX, yPos + 28);

  pdf.setTextColor(...primaryDark);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CHECK-IN', dividerX + 8, cardY + 2);
  pdf.setTextColor(...black);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text((bookingData.checkInDate as string) || 'N/A', dividerX + 8, cardY + 9);
  if (bookingData.checkInTime) {
    pdf.setTextColor(...gray);
    pdf.setFontSize(8);
    pdf.text(bookingData.checkInTime as string, dividerX + 8, cardY + 15);
  }

  const dividerX2 = margin + (contentWidth/3) * 2;
  pdf.setDrawColor(...primaryColor);
  pdf.line(dividerX2, yPos + 4, dividerX2, yPos + 28);

  pdf.setTextColor(...primaryDark);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CHECK-OUT', dividerX2 + 8, cardY + 2);
  pdf.setTextColor(...black);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text((bookingData.checkOutDate as string) || 'N/A', dividerX2 + 8, cardY + 9);
  if (bookingData.checkOutTime) {
    pdf.setTextColor(...gray);
    pdf.setFontSize(8);
    pdf.text(bookingData.checkOutTime as string, dividerX2 + 8, cardY + 15);
  }

  pdf.setTextColor(...gray);
  pdf.setFontSize(7);
  pdf.text(`Booking ID: ${bookingData.bookingId}`, margin + cardPadding, yPos + 26);

  yPos += 40;

  // Payment Summary
  pdf.setTextColor(...primaryDark);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYMENT SUMMARY', margin, yPos);
  pdf.setDrawColor(...primaryColor);
  pdf.line(margin, yPos + 1.5, margin + 40, yPos + 1.5);

  yPos += 8;

  const rowHeight = 8;
  pdf.setFillColor(...primaryColor);
  pdf.rect(margin, yPos, contentWidth, rowHeight, 'F');
  pdf.setTextColor(...white);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Description', margin + 4, yPos + 5.5);
  pdf.text('Amount', pageWidth - margin - 4, yPos + 5.5, { align: 'right' });

  yPos += rowHeight;

  const totalAmount = Number(bookingData.totalAmount) || 0;
  const downPayment = Number(bookingData.downPayment) || 0;
  const remainingBalance = totalAmount - downPayment;

  // Total row
  pdf.setFillColor(...white);
  pdf.rect(margin, yPos, contentWidth, rowHeight, 'F');
  pdf.setTextColor(...black);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Total Amount', margin + 4, yPos + 5.5);
  pdf.text(`₱${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, yPos + 5.5, { align: 'right' });
  yPos += rowHeight;

  // Down Payment row
  pdf.setFillColor(...lightGray);
  pdf.rect(margin, yPos, contentWidth, rowHeight, 'F');
  pdf.setTextColor(...black);
  pdf.text('Down Payment (Paid)', margin + 4, yPos + 5.5);
  pdf.setTextColor(...green);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`- ₱${downPayment.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, yPos + 5.5, { align: 'right' });
  yPos += rowHeight;

  // Remaining Balance row
  pdf.setFillColor(...white);
  pdf.rect(margin, yPos, contentWidth, rowHeight, 'F');
  pdf.setTextColor(...black);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Remaining Balance (Due at Check-in)', margin + 4, yPos + 5.5);
  const balanceColor = remainingBalance > 0 ? red : green;
  pdf.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`₱${remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, yPos + 5.5, { align: 'right' });
  yPos += rowHeight + 2;

  // Amount Paid box
  pdf.setFillColor(...primarySoft);
  pdf.roundedRect(margin, yPos, contentWidth, 16, 2, 2, 'F');
  pdf.setTextColor(...primaryDark);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AMOUNT PAID', margin + 4, yPos + 10);
  pdf.setTextColor(...primaryColor);
  pdf.setFontSize(13);
  pdf.text(`₱${downPayment.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, yPos + 10, { align: 'right' });

  yPos += 26;

  // Important Notes
  pdf.setFillColor(...lightGray);
  pdf.roundedRect(margin, yPos, contentWidth, 28, 2, 2, 'F');
  pdf.setTextColor(...primaryDark);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Important Notes:', margin + 4, yPos + 6);
  pdf.setTextColor(...gray);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text('• Please present this receipt and a valid ID during check-in.', margin + 4, yPos + 12);
  pdf.text('• Standard check-in: 2:00 PM | Standard check-out: 12:00 PM', margin + 4, yPos + 17);
  pdf.text('• Security deposit will be refunded upon check-out if no damages.', margin + 4, yPos + 22);

  // Footer
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.8);
  pdf.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);
  pdf.setTextColor(...primaryColor);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Thank you for choosing Staycation Haven!', pageWidth / 2, pageHeight - 15, { align: 'center' });
  pdf.setTextColor(...gray);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text('This is a computer-generated receipt. No signature required.', pageWidth / 2, pageHeight - 9, { align: 'center' });

  return Buffer.from(pdf.output('arraybuffer'));
}

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();

    // Generate PDF receipt
    const pdfBuffer = await generateReceiptPDF(bookingData);

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
        <title>Booking Pending Approval - Staycation Haven</title>
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
            background-color: #6B7280;
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
            color: #8B6508;
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
            border-left: 4px solid #8B6508;
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
            background-color: #4A2C2A;
            color: #F9F6F0;
            padding: 30px 25px;
            border-radius: 8px;
            margin: 30px 0;
            text-align: center;
            box-shadow: 0 4px 15px rgba(74, 44, 42, 0.2);
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
            border-top: 2px solid rgba(184, 134, 11, 0.3);
            font-size: 24px;
            font-weight: 700;
            color: #B8860B;
          }

          .alert-box {
            background-color: #FFFFFF;
            border: 1px solid #F2EBD9;
            border-left: 4px solid #8B6508;
            padding: 25px 30px;
            margin: 30px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(184, 134, 11, 0.1);
          }

          .alert-title {
            font-weight: 700;
            color: #8B6508;
            margin-bottom: 15px;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .alert-box ul {
            margin-left: 20px;
            color: #5D4037;
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
            color: #8B6508;
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
            background-color: #8B6508;
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
            background-color: #B8860B;
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
            color: #8B6508;
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
              <i class="fas fa-clock"></i>
              <span>Pending Approval</span>
            </div>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="greeting">Dear ${bookingData.firstName} ${bookingData.lastName},</div>

            <p class="intro-text">
              Thank you for choosing <span class="highlight">Staycation Haven</span>! We have received your booking request 
              and it is currently pending approval from our team. We will review your booking 
              and get back to you within 24 hours.
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

            <!-- Receipt Attachment Notice -->
            <div class="alert-box" style="background-color: #FEF3C7; border-left-color: #F59E0B;">
              <div class="alert-title" style="color: #D97706;">
                <i class="fas fa-file-pdf"></i>
                <span>Your Booking Receipt is Attached</span>
              </div>
              <ul>
                <li><strong>Please download and save the attached PDF receipt</strong></li>
                <li><strong style="color: #B8860B;">IMPORTANT: Bring this receipt (printed or digital) when you check-in</strong></li>
                <li>You will also need to present a valid government ID</li>
                <li>The receipt contains your booking QR code for quick check-in</li>
              </ul>
            </div>

            <!-- Important Information -->
            <div class="alert-box">
              <div class="alert-title">
                <i class="fas fa-sync-alt"></i>
                <span>What Happens Next?</span>
              </div>
              <ul>
                <li>Our team will review your booking request and payment proof</li>
                <li>You will receive a confirmation email once your booking is approved</li>
                <li>This usually takes 12-24 hours during business days</li>
                <li>Keep this email and the attached receipt for your records</li>
                <li>If you have any questions, feel free to contact us</li>
                <li>Please ensure your payment proof is clear and complete</li>
              </ul>
            </div>

            <p class="intro-text" style="margin-top: 30px;">
              Thank you for your patience! We're excited to host you at <span class="highlight">Staycation Haven</span>. 
              If you have any urgent concerns or questions about your booking, please don't 
              hesitate to reach out to us directly.
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

    // Send email with PDF attachment
    const mailOptions = {
      from: `"Staycation Haven" <${process.env.EMAIL_USER}>`,
      to: bookingData.email,
      subject: `Booking Pending Approval - ${bookingData.bookingId}`,
      html: emailHtml,
      attachments: [
        {
          filename: `Staycation-Receipt-${bookingData.bookingId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
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
