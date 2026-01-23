'use client';

import { ArrowLeft, Calendar, Users, MapPin, Clock, CreditCard, User, Mail, Phone, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Booking {
  booking_id: string;
  status: string;
  room_name: string;
  room_images?: string[];
  tower?: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  adults: number;
  children: number;
  infants: number;
  check_in_date: string;
  check_in_time: string;
  check_out_date: string;
  check_out_time: string;
  room_rate: number;
  security_deposit: number;
  add_ons_total: number;
  total_amount: number;
  down_payment: number;
  payment_method: string;
  [key: string]: unknown;
}

interface BookingDetailsClientProps {
  booking: Booking;
  userId: string;
}

export default function BookingDetailsClient({ booking }: BookingDetailsClientProps) {
  const router = useRouter();

  const formatTo12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleDownloadReceipt = async () => {
    const doc = new jsPDF();

    // Load header image as base64
    const loadImageAsBase64 = async (src: string): Promise<string> => {
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        throw error;
      }
    };

    try {
      const base64Image = await loadImageAsBase64('/Images/bg.jpg');
      // Add image as header (full width, 50mm height)
      doc.addImage(base64Image, 'JPEG', 0, 0, 210, 50);
    } catch (error) {
      console.error('Failed to load header image:', error);
      // Fallback if image fails to load
      doc.setFillColor(249, 115, 22);
      doc.rect(0, 0, 210, 50, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('ESCAPE INTO THE CITY', 105, 22, { align: 'center' });
      doc.setFontSize(14);
      doc.text('STAYCATION HAVEN', 105, 33, { align: 'center' });
    }

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Receipt title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BOOKING RECEIPT', 105, 65, { align: 'center' });

    // Booking ID and Status
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Booking ID: ${booking.booking_id}`, 20, 80);
    doc.text(`Status: ${booking.status.toUpperCase()}`, 20, 87);
    doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 20, 94);

    // Room and Guest Details
    let yPos = 110;

    // Room Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Room Information', 20, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Room: ${booking.room_name}`, 20, yPos);
    yPos += 6;
    if (booking.tower) {
      doc.text(`Location: ${booking.tower}`, 20, yPos);
      yPos += 6;
    }

    yPos += 5;

    // Guest Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Guest Information', 20, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${booking.guest_first_name} ${booking.guest_last_name}`, 20, yPos);
    yPos += 6;
    doc.text(`Email: ${booking.guest_email}`, 20, yPos);
    yPos += 6;
    doc.text(`Phone: ${booking.guest_phone}`, 20, yPos);
    yPos += 6;
    doc.text(`Guests: ${booking.adults} Adults, ${booking.children} Children, ${booking.infants} Infants`, 20, yPos);
    yPos += 10;

    // Stay Details Table
    autoTable(doc, {
      startY: yPos,
      head: [['Check-in', 'Check-out']],
      body: [
        [
          `${new Date(booking.check_in_date).toLocaleDateString()} at ${formatTo12Hour(booking.check_in_time)}`,
          `${new Date(booking.check_out_date).toLocaleDateString()} at ${formatTo12Hour(booking.check_out_time)}`
        ]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [194, 153, 88], // Gold color
        fontSize: 10,
        fontStyle: 'bold',
        textColor: [255, 255, 255]
      },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Payment Summary Table
    const formatAmount = (amount: number) => {
      const num = Number(amount).toFixed(2);
      const parts = num.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return `Php ${parts.join('.')}`;
    };

    const paymentData = [
      ['Room Rate', formatAmount(booking.room_rate)],
      ['Security Deposit', formatAmount(booking.security_deposit)],
    ];

    if (booking.add_ons_total > 0) {
      paymentData.push(['Add-ons', formatAmount(booking.add_ons_total)]);
    }

    paymentData.push(
      ['', ''],
      ['Total Amount', formatAmount(booking.total_amount)],
      ['Down Payment Paid', formatAmount(booking.down_payment)],
      ['Balance Due', formatAmount(booking.total_amount - booking.down_payment)]
    );

    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Amount']],
      body: paymentData,
      theme: 'grid',
      headStyles: {
        fillColor: [194, 153, 88], // Gold color (#C29958)
        fontSize: 9,
        fontStyle: 'bold',
        textColor: [255, 255, 255]
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle'
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 95 },
        1: { halign: 'right', cellWidth: 75, fontSize: 8 }
      },
      didParseCell: (data) => {
        if (data.row.index === paymentData.length - 3 || data.row.index === paymentData.length - 2 || data.row.index === paymentData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for choosing Staycation Haven!', 105, pageHeight - 20, { align: 'center' });
    doc.text('For inquiries, please contact us at info@staycationhaven.com', 105, pageHeight - 15, { align: 'center' });
    doc.text(`Payment Method: ${booking.payment_method}`, 105, pageHeight - 10, { align: 'center' });

    // Save the PDF
    doc.save(`Booking_Receipt_${booking.booking_id}.pdf`);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gradient-to-r from-[#C5A059] to-[#4A2C2A] text-white shadow-md tracking-wider border-none',
      approved: 'bg-[#F9F6F0] text-[#4A2C2A] border border-[#C5A059]',
      confirmed: 'bg-green-50 text-green-800 border border-green-200',
      completed: 'bg-gray-50 text-gray-700 border border-gray-200',
      cancelled: 'bg-red-50 text-red-800 border border-red-100',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5 text-white" />;
    }
  };

  const firstImage = Array.isArray(booking.room_images) && booking.room_images.length > 0
    ? booking.room_images[0]
    : '/Images/bg.jpg';

  return (
    <div className="min-h-screen bg-[#F9F6F0] pt-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => router.push('/my-bookings')}
          className="flex items-center gap-2 text-[#4A2C2A]/70 hover:text-[#C5A059] mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium tracking-wide">Back to My Bookings</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl shadow-[#4A2C2A]/5 border border-[#C5A059]/10 p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#C5A059] mb-2 tracking-tight">
                Booking Details
              </h1>
              <p className="text-[#4A2C2A]/60 font-medium">
                Booking ID: <span className="font-mono text-[#C5A059] ml-1">{booking.booking_id}</span>
              </p>
            </div>
            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              <span className="font-semibold uppercase text-xs tracking-widest">{booking.status}</span>
            </div>
          </div>

          {/* Room Info with Image */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 bg-gradient-to-b from-[#F9F6F0] to-[#C5A059]/10 rounded-xl border border-[#C5A059]/10">
            <div className="relative h-56 md:h-auto rounded-lg overflow-hidden shadow-md">
              <Image
                src={firstImage}
                alt={booking.room_name}
                fill
                className="object-cover"
              />
            </div>
            <div className="md:col-span-2 flex flex-col justify-center space-y-4">
              <div>
                <h2 className="text-3xl font-bold text-[#4A2C2A] mb-2 font-serif">
                  {booking.room_name}
                </h2>
                <div className="flex items-center gap-2 text-[#4A2C2A]/70">
                  <MapPin className="w-4 h-4 text-[#C5A059]" />
                  <span className="font-medium tracking-wide">{booking.tower || 'Quezon City'}</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-[#C5A059]">
                ₱{booking.total_amount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stay Details */}
            <div className="bg-white rounded-2xl shadow-lg shadow-[#4A2C2A]/5 border border-[#C5A059]/10 p-8">
              <h3 className="text-xl font-bold text-[#4A2C2A] mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#C5A059]" />
                Stay Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#F9F6F0] p-6 rounded-xl border border-[#C5A059]/5">
                  <div className="flex items-center gap-2 text-[#C5A059] mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest">Check-in</span>
                  </div>
                  <p className="text-xl font-bold text-[#4A2C2A] mb-1">
                    {new Date(booking.check_in_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <div className="flex items-center gap-2 text-[#4A2C2A]/60 font-medium">
                    <Clock className="w-4 h-4" />
                    <span>{booking.check_in_time}</span>
                  </div>
                </div>
                <div className="bg-[#F9F6F0] p-6 rounded-xl border border-[#C5A059]/5">
                  <div className="flex items-center gap-2 text-[#C5A059] mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest">Check-out</span>
                  </div>
                  <p className="text-xl font-bold text-[#4A2C2A] mb-1">
                    {new Date(booking.check_out_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <div className="flex items-center gap-2 text-[#4A2C2A]/60 font-medium">
                    <Clock className="w-4 h-4" />
                    <span>{booking.check_out_time}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="bg-white rounded-2xl shadow-lg shadow-[#4A2C2A]/5 border border-[#C5A059]/10 p-8">
              <h3 className="text-xl font-bold text-[#4A2C2A] mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C5A059]" />
                Guest Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-[#F9F6F0] rounded-lg text-[#C5A059]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#4A2C2A]/50 uppercase tracking-wider mb-1">Guest Name</p>
                    <p className="font-semibold text-[#4A2C2A] text-lg">
                      {booking.guest_first_name} {booking.guest_last_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-[#F9F6F0] rounded-lg text-[#C5A059]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#4A2C2A]/50 uppercase tracking-wider mb-1">Email</p>
                    <p className="font-semibold text-[#4A2C2A] text-lg">{booking.guest_email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-[#F9F6F0] rounded-lg text-[#C5A059]">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#4A2C2A]/50 uppercase tracking-wider mb-1">Phone</p>
                    <p className="font-semibold text-[#4A2C2A] text-lg">{booking.guest_phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-[#F9F6F0] rounded-lg text-[#C5A059]">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#4A2C2A]/50 uppercase tracking-wider mb-1">Guests</p>
                    <p className="font-semibold text-[#4A2C2A] text-lg">
                      {booking.adults} Adults, {booking.children} Children, {booking.infants} Infants
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl shadow-[#4A2C2A]/5 border border-[#C5A059]/10 p-8 sticky top-24">
              <h3 className="text-xl font-bold text-[#4A2C2A] mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#C5A059]" />
                Payment Summary
              </h3>
              
              <div className="space-y-4 mb-6 pb-6 border-b border-[#F9F6F0]">
                <div className="flex justify-between items-center text-[#4A2C2A]/70">
                  <span>Room Rate</span>
                  <span className="font-semibold text-[#4A2C2A]">₱{booking.room_rate.toLocaleString()}</span>
                </div>
                {booking.add_ons_total > 0 && (
                  <div className="flex justify-between items-center text-[#4A2C2A]/70">
                    <span>Add-ons</span>
                    <span className="font-semibold text-[#4A2C2A]">₱{booking.add_ons_total.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[#4A2C2A]/70">
                  <span>Security Deposit</span>
                  <span className="font-semibold text-[#4A2C2A]">₱{booking.security_deposit.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-6">
                <span className="text-lg font-bold text-[#4A2C2A]">Total</span>
                <span className="text-3xl font-bold text-[#C5A059]">
                  ₱{booking.total_amount.toLocaleString()}
                </span>
              </div>

              <div className="bg-[#F9F6F0] rounded-xl p-5 mb-6 space-y-3 border border-[#C5A059]/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#4A2C2A]/60">Down Payment</span>
                  <span className="text-lg font-bold text-[#4A2C2A]">₱{booking.down_payment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#4A2C2A]/60">Payment Method</span>
                  <span className="font-semibold text-[#C5A059] uppercase text-sm tracking-wide">{booking.payment_method}</span>
                </div>
              </div>

              <button
                onClick={handleDownloadReceipt}
                className="w-full flex items-center justify-center gap-2 bg-[#C5A059] hover:bg-[#4A2C2A] text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-[#C5A059]/20 hover:shadow-[#4A2C2A]/20"
              >
                <Download className="w-5 h-5" />
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
