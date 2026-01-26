import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

interface AddOns {
  poolPass?: number;
  towels?: number;
  bathRobe?: number;
  extraComforter?: number;
  guestKit?: number;
  extraSlippers?: number;
}

interface BookingData {
  bookingId: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  roomName: string;
  stayType?: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  adults?: number;
  children?: number;
  infants?: number;
  numberOfNights?: number;
  roomRate?: number;
  securityDeposit?: number;
  addOns?: AddOns;
  addOnsTotal?: number;
  totalAmount: string | number;
  downPayment: string | number;
  remainingBalance: string | number;
  paymentMethod?: string;
}

const ADD_ON_LABELS: Record<string, string> = {
  poolPass: 'Pool Pass',
  towels: 'Extra Towels',
  bathRobe: 'Bath Robe',
  extraComforter: 'Extra Comforter',
  guestKit: 'Guest Kit',
  extraSlippers: 'Extra Slippers',
};

const ADD_ON_PRICES: Record<string, number> = {
  poolPass: 100,
  towels: 50,
  bathRobe: 150,
  extraComforter: 100,
  guestKit: 75,
  extraSlippers: 30,
};

export async function POST(request: NextRequest) {
  try {
    const bookingData: BookingData = await request.json();

    // Generate QR Code for booking reference
    const qrCodeDataURL = await QRCode.toDataURL(bookingData.bookingId, {
      width: 300,
      margin: 1,
      color: {
        dark: '#B8860B',
        light: '#FFFFFF'
      }
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Theme colors (no gradients)
    const primaryColor: [number, number, number] = [184, 134, 11]; // #B8860B
    const primaryDark: [number, number, number] = [139, 101, 8]; // #8B6508
    const primarySoft: [number, number, number] = [245, 222, 179]; // #F5DEB3
    const white: [number, number, number] = [255, 255, 255];
    const black: [number, number, number] = [33, 33, 33];
    const gray: [number, number, number] = [107, 114, 128];
    const lightGray: [number, number, number] = [249, 250, 251];
    const green: [number, number, number] = [34, 139, 34];
    const red: [number, number, number] = [220, 53, 69];

    let yPos = margin;

    // ========== HEADER SECTION WITH QR CODE ==========
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 60, 'F');

    // Logo/Brand section (left side)
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

    // QR Code (right side of header)
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

    // ========== RECEIPT INFO BAR ==========
    pdf.setFillColor(...lightGray);
    pdf.rect(margin, yPos, contentWidth, 10, 'F');

    pdf.setTextColor(...gray);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Receipt #: ${bookingData.bookingId}`, margin + 4, yPos + 7);
    pdf.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - margin - 4, yPos + 7, { align: 'right' });

    yPos += 18;

    // ========== GUEST INFORMATION ==========
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

    // Guest Name
    pdf.setTextColor(...gray);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Guest Name', col1X, yPos);
    pdf.setTextColor(...black);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${bookingData.firstName} ${bookingData.lastName || ''}`, col1X, yPos + 5);

    // Email
    pdf.setTextColor(...gray);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Email Address', col2X, yPos);
    pdf.setTextColor(...black);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(bookingData.email || 'N/A', col2X, yPos + 5);

    yPos += 14;

    // Phone
    pdf.setTextColor(...gray);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Phone Number', col1X, yPos);
    pdf.setTextColor(...black);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(bookingData.phone || 'N/A', col1X, yPos + 5);

    // Guests count
    const adults = bookingData.adults || 1;
    const children = bookingData.children || 0;
    const infants = bookingData.infants || 0;
    const guestSummary = `${adults} Adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''}${infants > 0 ? `, ${infants} Infant${infants > 1 ? 's' : ''}` : ''}`;

    pdf.setTextColor(...gray);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Number of Guests', col2X, yPos);
    pdf.setTextColor(...black);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(guestSummary, col2X, yPos + 5);

    yPos += 16;

    // ========== BOOKING DETAILS ==========
    pdf.setTextColor(...primaryDark);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BOOKING DETAILS', margin, yPos);
    pdf.setDrawColor(...primaryColor);
    pdf.line(margin, yPos + 1.5, margin + 38, yPos + 1.5);

    yPos += 8;

    // Booking info card
    pdf.setFillColor(...primarySoft);
    pdf.roundedRect(margin, yPos, contentWidth, 32, 2, 2, 'F');

    const cardPadding = 6;
    const cardY = yPos + cardPadding;

    // Room
    pdf.setTextColor(...primaryDark);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ROOM', margin + cardPadding, cardY + 2);
    pdf.setTextColor(...black);
    pdf.setFontSize(11);
    pdf.text(bookingData.roomName || 'N/A', margin + cardPadding, cardY + 9);

    // Stay Type
    if (bookingData.stayType) {
      pdf.setTextColor(...gray);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text(bookingData.stayType, margin + cardPadding, cardY + 15);
    }

    // Dividers and check-in/out info
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
    pdf.text(bookingData.checkInDate || 'N/A', dividerX + 8, cardY + 9);
    if (bookingData.checkInTime) {
      pdf.setTextColor(...gray);
      pdf.setFontSize(8);
      pdf.text(bookingData.checkInTime, dividerX + 8, cardY + 15);
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
    pdf.text(bookingData.checkOutDate || 'N/A', dividerX2 + 8, cardY + 9);
    if (bookingData.checkOutTime) {
      pdf.setTextColor(...gray);
      pdf.setFontSize(8);
      pdf.text(bookingData.checkOutTime, dividerX2 + 8, cardY + 15);
    }

    // Booking ID at bottom of card
    pdf.setTextColor(...gray);
    pdf.setFontSize(7);
    pdf.text(`Booking ID: ${bookingData.bookingId}`, margin + cardPadding, yPos + 26);

    yPos += 40;

    // ========== PAYMENT SUMMARY ==========
    pdf.setTextColor(...primaryDark);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAYMENT SUMMARY', margin, yPos);
    pdf.setDrawColor(...primaryColor);
    pdf.line(margin, yPos + 1.5, margin + 40, yPos + 1.5);

    yPos += 8;

    // Payment table
    const rowHeight = 8;

    // Table header
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, yPos, contentWidth, rowHeight, 'F');
    pdf.setTextColor(...white);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Description', margin + 4, yPos + 5.5);
    pdf.text('Amount', pageWidth - margin - 4, yPos + 5.5, { align: 'right' });

    yPos += rowHeight;

    // Parse amounts
    const totalAmount = typeof bookingData.totalAmount === 'string'
      ? parseFloat(bookingData.totalAmount)
      : bookingData.totalAmount || 0;
    const downPayment = typeof bookingData.downPayment === 'string'
      ? parseFloat(bookingData.downPayment)
      : bookingData.downPayment || 0;
    const remainingBalance = typeof bookingData.remainingBalance === 'string'
      ? parseFloat(bookingData.remainingBalance)
      : bookingData.remainingBalance || 0;
    const roomRate = bookingData.roomRate || 0;
    const securityDeposit = bookingData.securityDeposit || 0;
    const addOnsTotal = bookingData.addOnsTotal || 0;

    let rowIndex = 0;

    // Room Rate row
    const rowBg1 = rowIndex % 2 === 0 ? white : lightGray;
    pdf.setFillColor(rowBg1[0], rowBg1[1], rowBg1[2]);
    pdf.rect(margin, yPos, contentWidth, rowHeight, 'F');
    pdf.setTextColor(...black);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const roomRateLabel = bookingData.numberOfNights && bookingData.numberOfNights > 1
      ? `Room Rate (${bookingData.numberOfNights} nights)`
      : 'Room Rate';
    pdf.text(roomRateLabel, margin + 4, yPos + 5.5);
    pdf.text(`₱${roomRate.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, yPos + 5.5, { align: 'right' });
    yPos += rowHeight;
    rowIndex++;

    // Security Deposit row
    if (securityDeposit > 0) {
      const rowBg2 = rowIndex % 2 === 0 ? white : lightGray;
      pdf.setFillColor(rowBg2[0], rowBg2[1], rowBg2[2]);
      pdf.rect(margin, yPos, contentWidth, rowHeight, 'F');
      pdf.setTextColor(...black);
      pdf.text('Security Deposit (Refundable)', margin + 4, yPos + 5.5);
      pdf.text(`₱${securityDeposit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, yPos + 5.5, { align: 'right' });
      yPos += rowHeight;
      rowIndex++;
    }

    // Add-ons rows
    if (bookingData.addOns && addOnsTotal > 0) {
      for (const [key, quantity] of Object.entries(bookingData.addOns)) {
        if (quantity && quantity > 0) {
          const price = ADD_ON_PRICES[key] || 0;
          const itemTotal = quantity * price;
          const label = ADD_ON_LABELS[key] || key;

          const rowBgAddOn = rowIndex % 2 === 0 ? white : lightGray;
          pdf.setFillColor(rowBgAddOn[0], rowBgAddOn[1], rowBgAddOn[2]);
          pdf.rect(margin, yPos, contentWidth, rowHeight, 'F');
          pdf.setTextColor(...black);
          pdf.text(`${label} x${quantity}`, margin + 4, yPos + 5.5);
          pdf.text(`₱${itemTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, yPos + 5.5, { align: 'right' });
          yPos += rowHeight;
          rowIndex++;
        }
      }
    }

    // Subtotal line
    pdf.setDrawColor(...gray);
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);

    // Total row
    pdf.setFillColor(...lightGray);
    pdf.rect(margin, yPos, contentWidth, rowHeight, 'F');
    pdf.setTextColor(...black);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total Amount', margin + 4, yPos + 5.5);
    pdf.text(`₱${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, yPos + 5.5, { align: 'right' });
    yPos += rowHeight;

    // Down Payment row
    pdf.setFillColor(...white);
    pdf.rect(margin, yPos, contentWidth, rowHeight, 'F');
    pdf.setTextColor(...black);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Down Payment (Paid)', margin + 4, yPos + 5.5);
    pdf.setTextColor(...green);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`- ₱${downPayment.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, yPos + 5.5, { align: 'right' });
    yPos += rowHeight;

    // Remaining Balance row
    pdf.setFillColor(...lightGray);
    pdf.rect(margin, yPos, contentWidth, rowHeight, 'F');
    pdf.setTextColor(...black);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Remaining Balance (Due at Check-in)', margin + 4, yPos + 5.5);
    const balanceColor = remainingBalance > 0 ? red : green;
    pdf.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`₱${remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, yPos + 5.5, { align: 'right' });
    yPos += rowHeight + 2;

    // Amount Paid highlight box
    pdf.setFillColor(...primarySoft);
    pdf.roundedRect(margin, yPos, contentWidth, 16, 2, 2, 'F');

    pdf.setTextColor(...primaryDark);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AMOUNT PAID', margin + 4, yPos + 10);

    pdf.setTextColor(...primaryColor);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`₱${downPayment.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, yPos + 10, { align: 'right' });

    // Payment status badge
    const isPaid = remainingBalance <= 0;
    const statusText = isPaid ? 'FULLY PAID' : 'PARTIALLY PAID';
    const statusColor: [number, number, number] = isPaid ? green : [255, 165, 0];

    pdf.setFillColor(...statusColor);
    const badgeWidth = 35;
    pdf.roundedRect(pageWidth - margin - badgeWidth, yPos + 1, badgeWidth, 8, 2, 2, 'F');
    pdf.setTextColor(...white);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text(statusText, pageWidth - margin - badgeWidth/2, yPos + 6, { align: 'center' });

    yPos += 26;

    // ========== PAYMENT METHOD ==========
    if (bookingData.paymentMethod) {
      pdf.setTextColor(...gray);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const methodLabel = bookingData.paymentMethod === 'gcash' ? 'GCash' : 'Bank Transfer';
      pdf.text(`Payment Method: ${methodLabel}`, margin, yPos);
      yPos += 8;
    }

    // ========== IMPORTANT NOTES ==========
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

    // ========== FOOTER ==========
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

    // Convert PDF to base64
    const pdfBase64 = pdf.output('datauristring');

    return NextResponse.json({
      success: true,
      pdfData: pdfBase64,
      qrCode: qrCodeDataURL
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate PDF receipt',
      },
      { status: 500 }
    );
  }
}
