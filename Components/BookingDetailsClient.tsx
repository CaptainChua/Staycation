'use client';

import { ArrowLeft, Calendar, Users, MapPin, Clock, CreditCard, User, Mail, Phone, CheckCircle, XCircle, AlertCircle, Download, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast, { Toaster } from 'react-hot-toast';
import SidebarLayout from './SidebarLayout';

interface Booking {
  booking_id: string;
  status: string;
  room_name: string;
  room_images?: string[];
  tower?: string;
  haven_id?: string;
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
  add_ons?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total_amount: number;
  down_payment: number;
  payment_method: string;
  created_at?: string;
  [key: string]: unknown;
}

interface BookingDetailsClientProps {
  booking: Booking;
  userId: string;
}

const BookingDetailsClient = ({ booking, userId }: BookingDetailsClientProps) => {
  const router = useRouter();

  const handleDownloadReceipt = async () => {
    const doc = new jsPDF();

    try {
      // Add header
      doc.setFillColor(197, 160, 89);
      doc.rect(0, 0, 210, 50, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('STAYCATION HAVEN', 105, 22, { align: 'center' });
      doc.setFontSize(14);
      doc.text('BOOKING RECEIPT', 105, 33, { align: 'center' });

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

      // Guest Information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Guest Information:', 20, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${booking.guest_first_name} ${booking.guest_last_name}`, 20, 107);
      doc.text(`Email: ${booking.guest_email}`, 20, 114);
      doc.text(`Phone: ${booking.guest_phone}`, 20, 121);

      // Booking Details
      doc.setFont('helvetica', 'bold');
      doc.text('Booking Details:', 20, 135);
      doc.setFont('helvetica', 'normal');
      doc.text(`Room: ${booking.room_name}`, 20, 142);
      doc.text(`Tower: ${booking.tower || 'Quezon City'}`, 20, 149);
      doc.text(`Check-in: ${new Date(booking.check_in_date).toLocaleDateString()} at ${booking.check_in_time}`, 20, 156);
      doc.text(`Check-out: ${new Date(booking.check_out_date).toLocaleDateString()} at ${booking.check_out_time}`, 20, 163);
      doc.text(`Guests: ${booking.adults} adults, ${booking.children} children, ${booking.infants} infants`, 20, 170);

      // Payment Summary Table
      const formatAmount = (amount: number) => {
        const num = Number(amount).toFixed(2);
        const parts = num.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return `Php ${parts.join('.')}`;
      };

      const paymentData = [
        ['Room Rate', formatAmount(booking.room_rate || 0)],
        ['Security Deposit', formatAmount(booking.security_deposit || 0)],
      ];

      if ((booking.add_ons_total || 0) > 0) {
        paymentData.push(['Add-ons', formatAmount(booking.add_ons_total || 0)]);
      }

      paymentData.push(
        ['', ''],
        ['Total Amount', formatAmount(booking.total_amount || 0)],
        ['Down Payment Paid', formatAmount(booking.down_payment || 0)],
        ['Balance Due', formatAmount((booking.total_amount || 0) - (booking.down_payment || 0))]
      );

      autoTable(doc, {
        startY: 185,
        head: [['Description', 'Amount']],
        body: paymentData,
        theme: 'grid',
        headStyles: {
          fillColor: [197, 160, 89],
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [249, 246, 240],
        },
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Thank you for choosing Staycation Haven!', 105, 280, { align: 'center' });
      doc.text('For inquiries, contact us at support@staycationhaven.com', 105, 285, { align: 'center' });

      // Save the PDF
      doc.save(`booking-receipt-${booking.booking_id}.pdf`);
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate receipt');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatTo12Hour = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const firstImage = Array.isArray(booking.room_images) && booking.room_images.length > 0
    ? booking.room_images[0]
    : '/Images/bg.jpg';

  const totalGuests = booking.adults + booking.children + booking.infants;

  return (
    <SidebarLayout>
      <Toaster position="top-center" />
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-12 overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 dark:bg-brand-primary/20 backdrop-blur-sm rounded-full mb-6 border border-brand-primary/20 dark:border-brand-primary/30">
            <Home className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Booking Details
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            View your complete booking information
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Badge with Back Button */}
        <div className="flex items-center justify-between py-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bookings
            </button>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              <span className="font-semibold uppercase text-xs tracking-widest">{booking.status}</span>
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Booking ID: <span className="font-mono font-semibold text-gray-900 dark:text-white">{booking.booking_id}</span>
          </div>
        </div>

        {/* Room Info with Image */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="relative h-64 lg:h-80">
                <Image
                  src={firstImage}
                  alt={booking.room_name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {booking.room_name}
                    </h2>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{booking.tower || 'Quezon City'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Amount</div>
                    <div className="text-2xl lg:text-3xl font-bold text-brand-primary">
                      ₱{(booking.total_amount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {/* Quick Info */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <Calendar className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <div className="text-xs text-gray-500 dark:text-gray-400">Check-in</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(booking.check_in_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <Calendar className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <div className="text-xs text-gray-500 dark:text-gray-400">Check-out</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(booking.check_out_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <div className="text-xs text-gray-500 dark:text-gray-400">Guests</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {totalGuests} people
                    </div>
                  </div>
                  <div className="text-center">
                    <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24))} nights
                    </div>
                  </div>
                </div>
              </div>

              {/* Stay Details */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-primary" />
                  Stay Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Check-in</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {new Date(booking.check_in_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {formatTo12Hour(booking.check_in_time)}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Check-out</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {new Date(booking.check_out_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {formatTo12Hour(booking.check_out_time)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-brand-primary" />
                  Booking Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Booking ID</span>
                    <span className="font-mono text-sm text-gray-900 dark:text-white">{booking.booking_id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Status</span>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      {booking.status}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Booked on</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-brand-primary" />
                Guest Information
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Name</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {booking.guest_first_name} {booking.guest_last_name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</div>
                  <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {booking.guest_email}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone</div>
                  <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {booking.guest_phone}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Guests</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {booking.adults} adults, {booking.children} children, {booking.infants} infants
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-primary" />
                Payment Summary
              </h3>
              
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Room Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₱{(booking.room_rate || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Security Deposit</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₱{(booking.security_deposit || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Down Payment</span>
                  <span className="font-bold text-gray-900 dark:text-white">₱{(booking.down_payment || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Method</span>
                  <span className="font-semibold text-brand-primary uppercase text-sm">{booking.payment_method}</span>
                </div>
              </div>

              <button
                onClick={handleDownloadReceipt}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primaryDark text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Download Receipt
              </button>
            </div>

            {/* Add-ons Section */}
            {booking.add_ons && booking.add_ons.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-brand-primary" />
                    Add-ons
                  </h3>
                  <div className="bg-brand-primary/10 dark:bg-brand-primary/20 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-brand-primary">
                      {booking.add_ons.length} item{booking.add_ons.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {Array.from(new Map(booking.add_ons.map((addOn, index) => [`${addOn.name}_${addOn.price}_${addOn.quantity}`, addOn])).values()).map((addOn, index) => (
                    <div key={`${addOn.name}_${addOn.price}_${addOn.quantity}_${index}`} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-brand-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{addOn.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Qty: {addOn.quantity}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-brand-primary">
                          ₱{(addOn.price * addOn.quantity).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ₱{addOn.price.toLocaleString()} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Add-ons Total</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ₱{booking.add_ons_total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default BookingDetailsClient;
