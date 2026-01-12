"use client";

import { MessageCircle, X, Send, HelpCircle, Calendar } from "lucide-react";
import { useState } from "react";

const MessageButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [bookingData, setBookingData] = useState<{
    booking_id: string;
    status: string;
    guest_first_name: string;
    guest_last_name: string;
    guest_email: string;
    guest_phone: string;
    room_name?: string;
    check_in_date: string;
    check_out_date: string;
    check_in_time: string;
    check_out_time: string;
    adults: number;
    children: number;
    infants: number;
    payment_method: string;
    room_rate: number;
    security_deposit: number;
    add_ons_total: number;
    total_amount: number;
    down_payment: number;
    remaining_balance: number;
    rejection_reason?: string;
    created_at?: string;
  } | null>(null);
  const [bookingError, setBookingError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  const quickActions = [
    {
      title: "Contact Support",
      description: "Get help from our team",
      icon: <HelpCircle className="w-5 h-5 text-brand-primary" />,
      action: () => handleQuickAction("contact")
    },
    {
      title: "Check Booking Status",
      description: "View your reservations",
      icon: <Calendar className="w-5 h-5 text-brand-primary" />,
      action: () => handleQuickAction("booking")
    }
  ];

  const handleQuickAction = (actionType: string) => {
    switch (actionType) {
      case "contact":
        setShowMessageForm(true);
        setShowBookingForm(false);
        break;
      case "booking":
        setShowBookingForm(true);
        setShowMessageForm(false);
        break;
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    // Here you can integrate with your backend API or email service
    console.log("Message sent:", { name, email, message });

    // For now, we'll open the default email client
    const subject = encodeURIComponent("Message from Staycation Haven Website");
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    window.location.href = `mailto:info@staycationhaven.ph?subject=${subject}&body=${body}`;

    // Reset form
    setName("");
    setEmail("");
    setMessage("");
    setShowMessageForm(false);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");
    setBookingData(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/bookings/search?booking_id=${encodeURIComponent(bookingId)}`);
      const data = await response.json();

      if (response.ok && data.success && data.booking) {
        setBookingData(data.booking);
      } else {
        setBookingError("Booking not found. Please check your booking ID.");
      }
    } catch {
      setBookingError("Failed to fetch booking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowMessageForm(false);
    setShowBookingForm(false);
    setBookingData(null);
    setBookingError("");
    setBookingId("");
    setShowFullDetails(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'checked-in': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      {/* Fixed Message Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center group"
        aria-label="Open messages"
      >
        {isOpen ? (
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : (
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-pulse" />
        )}
      </button>

      {/* Message Panel */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-20 sm:bottom-24 sm:right-6 sm:left-auto z-50 w-auto sm:w-[380px] md:w-[420px] lg:w-[450px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-bottom-5 duration-300 max-h-[calc(100vh-120px)] sm:max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="bg-brand-primary text-white p-4 sm:p-5 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold text-lg sm:text-xl">Messages</h3>
                  <p className="text-sm text-white/90 mt-1">How can we help you today?</p>
                </div>
                <button
                  onClick={handleClose}
                  className="sm:hidden text-white/80 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {!showMessageForm && !showBookingForm ? (
                <div className="space-y-4">
                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Quick Actions</p>
                    <div className="grid grid-cols-1 gap-2">
                      {quickActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.action}
                          className="w-full text-left p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-brand-primary dark:hover:border-brand-primary transition-all duration-200 group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {action.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-brand-primary transition-colors">
                                {action.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                {action.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                      <strong className="font-semibold">Need immediate help?</strong>
                      <br />
                      Our support team is available 24/7 to assist you with any questions or concerns.
                    </p>
                  </div>
                </div>
              ) : showBookingForm ? (
                /* Booking Form */
                <div className="space-y-4">
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="bookingId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Booking ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="bookingId"
                        value={bookingId}
                        onChange={(e) => setBookingId(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-gray-100 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your booking ID"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowBookingForm(false);
                          setBookingData(null);
                          setBookingError("");
                          setBookingId("");
                        }}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading...
                          </>
                        ) : (
                          "Submit"
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Error Message */}
                  {bookingError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                      <p className="text-sm text-red-800 dark:text-red-400">{bookingError}</p>
                    </div>
                  )}

                  {/* Booking Details */}
                  {bookingData && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Booking Status</h4>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(bookingData.status)}`}>
                          {bookingData.status === 'completed' ? 'DONE' : bookingData.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Booking ID:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {bookingData.booking_id}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Guest Name:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {bookingData.guest_first_name} {bookingData.guest_last_name}
                          </span>
                        </div>

                        {bookingData.room_name && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Room:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{bookingData.room_name}</span>
                          </div>
                        )}

                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Check-in:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatDate(bookingData.check_in_date)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Check-out:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatDate(bookingData.check_out_date)}
                          </span>
                        </div>

                        {bookingData.rejection_reason && (
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                            <span className="text-gray-600 dark:text-gray-400">Rejection Reason:</span>
                            <p className="text-red-600 dark:text-red-400 text-xs mt-1">{bookingData.rejection_reason}</p>
                          </div>
                        )}

                        {/* Show Full Details Button */}
                        <button
                          onClick={() => setShowFullDetails(!showFullDetails)}
                          className="w-full mt-3 text-brand-primary hover:text-brand-primaryDark text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                        >
                          {showFullDetails ? 'Hide' : 'Show'} booking details
                          <svg
                            className={`w-4 h-4 transition-transform ${showFullDetails ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Full Details - Collapsible */}
                        {showFullDetails && (
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Email:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {bookingData.guest_email}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {bookingData.guest_phone}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Check-in Time:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {bookingData.check_in_time}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Check-out Time:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {bookingData.check_out_time}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Guests:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {bookingData.adults} Adult{bookingData.adults > 1 ? 's' : ''}
                                {bookingData.children > 0 && `, ${bookingData.children} Child${bookingData.children > 1 ? 'ren' : ''}`}
                                {bookingData.infants > 0 && `, ${bookingData.infants} Infant${bookingData.infants > 1 ? 's' : ''}`}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {bookingData.payment_method}
                              </span>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Room Rate:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  ₱{bookingData.room_rate.toLocaleString()}
                                </span>
                              </div>
                              {bookingData.security_deposit > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Security Deposit:</span>
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    ₱{bookingData.security_deposit.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {bookingData.add_ons_total > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Add-ons Total:</span>
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    ₱{bookingData.add_ons_total.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                                <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                                <span className="text-gray-900 dark:text-gray-100">
                                  ₱{bookingData.total_amount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Down Payment:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  ₱{bookingData.down_payment.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Remaining Balance:</span>
                                <span className="font-medium text-brand-primary">
                                  ₱{bookingData.remaining_balance.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {bookingData.created_at && (
                              <div className="flex justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-gray-500 dark:text-gray-500">Booked on:</span>
                                <span className="text-gray-500 dark:text-gray-500">
                                  {formatDate(bookingData.created_at)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Message Form */
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-gray-100 text-sm transition-all"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-gray-100 text-sm transition-all"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Your Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-gray-100 text-sm resize-none transition-all"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowMessageForm(false)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Message
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            {!showMessageForm && !showBookingForm && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50">
                <button
                  onClick={() => setShowMessageForm(true)}
                  className="w-full bg-brand-primary hover:bg-brand-primaryDark text-white py-2.5 sm:py-3 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <Send className="w-4 h-4" />
                  Send us a message
                </button>
              </div>
            )}
        </div>
      )}
    </>
  );
};

export default MessageButton;