"use client";

import { RefreshCw, DollarSign, Calendar, AlertTriangle } from "lucide-react";
import SidebarLayout from "@/Components/SidebarLayout";

const CancellationPolicy = () => {
  return (
    <SidebarLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-12 overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 dark:bg-brand-primary/20 backdrop-blur-sm rounded-full mb-6 border border-brand-primary/20 dark:border-brand-primary/30">
            <RefreshCw className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Cancellation Policy
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Understand our flexible cancellation and refund terms
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Cancellation Timeline */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Cancellation Timeline</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl border-2 border-green-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">48+ Hours Before Check-in</h3>
                  <p className="text-gray-600 mb-3">
                    Cancel your booking 48 hours or more before your scheduled check-in time.
                  </p>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-green-700 font-semibold">✓ Full Refund (100%)</p>
                    <p className="text-sm text-green-600 mt-1">No cancellation fees applied</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-orange-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">24-48 Hours Before Check-in</h3>
                  <p className="text-gray-600 mb-3">
                    Cancel your booking between 24 to 48 hours before check-in.
                  </p>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-orange-700 font-semibold">⚠ Partial Refund (50%)</p>
                    <p className="text-sm text-orange-600 mt-1">50% cancellation fee will be deducted</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-red-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Less Than 24 Hours or No-Show</h3>
                  <p className="text-gray-600 mb-3">
                    Cancel less than 24 hours before check-in or fail to show up.
                  </p>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-red-700 font-semibold">✗ No Refund (0%)</p>
                    <p className="text-sm text-red-600 mt-1">Full booking amount is non-refundable</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How to Cancel */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Cancel Your Booking</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-primary font-bold">1</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Log In to Your Account</h3>
                  <p className="text-gray-600">Access your Staycation Haven account using your email and password.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-primary font-bold">2</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Go to My Bookings</h3>
                  <p className="text-gray-600">Navigate to the &quot;My Bookings&quot; section from your profile menu.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-primary font-bold">3</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Your Booking</h3>
                  <p className="text-gray-600">Find the booking you wish to cancel and click &quot;View Details&quot; or &quot;Cancel Booking.&quot;</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-primary font-bold">4</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Cancellation</h3>
                  <p className="text-gray-600">Review the cancellation policy and refund amount, then confirm your cancellation.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-primary font-bold">5</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Receive Confirmation</h3>
                  <p className="text-gray-600">You&apos;ll receive an email confirmation of your cancellation and refund details.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Alternative:</strong> You can also contact our support team directly at{" "}
                <a href="mailto:support@staycationhaven.ph" className="text-brand-primary hover:underline">
                  support@staycationhaven.ph
                </a>{" "}
                or call us at{" "}
                <a href="tel:+639123456789" className="text-brand-primary hover:underline">
                  +63 912 345 6789
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Refund Process */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Refund Process</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4 mb-6">
              <DollarSign className="w-6 h-6 text-brand-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Processing Timeline</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-primary font-bold">•</span>
                    <span>Refunds are processed within 5-7 business days after cancellation approval</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-primary font-bold">•</span>
                    <span>Depending on your payment method, it may take an additional 3-5 business days for the refund to appear in your account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-primary font-bold">•</span>
                    <span>Refunds will be issued to the original payment method used for booking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-primary font-bold">•</span>
                    <span>You will receive an email notification once the refund has been processed</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Special Circumstances */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Special Circumstances</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <RefreshCw className="w-6 h-6 text-brand-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Emergency Situations</h3>
                <p className="text-gray-600 mb-4">
                  We understand that unexpected situations may arise. In cases of emergencies (medical, natural disasters, etc.), please contact our support team immediately. We will review your case and may offer flexible cancellation options on a case-by-case basis.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Weather-Related Cancellations</h3>
                <p className="text-gray-600">
                  In the event of severe weather conditions or natural disasters that make travel unsafe, we may waive cancellation fees. Official weather advisories or travel warnings must be provided.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Important Notes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Important Notes</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>All cancellation times are based on Philippine Standard Time (PST)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Partial stay cancellations are not eligible for refunds</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Group bookings (5+ rooms) may have different cancellation terms</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Special promotional rates may have non-refundable terms - check your booking details</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>This policy is subject to change - the policy in effect at the time of booking applies</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Contact Support */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help with Cancellation?</h2>
          <p className="text-gray-600 mb-6">
            Our support team is ready to assist you with your cancellation or answer any questions.
          </p>
          <a
            href="/help-center"
            className="inline-block bg-brand-primary hover:bg-brand-primaryDark text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default CancellationPolicy;
