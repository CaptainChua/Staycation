"use client";

import { FileText } from "lucide-react";
import SidebarLayout from "@/Components/SidebarLayout";

const TermsOfService = () => {
  return (
    <SidebarLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-16 overflow-hidden border-b border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div className="absolute top-0 left-0 w-72 h-72 bg-brand-primary rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-primary rounded-full translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-400 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 dark:bg-brand-primary/20 backdrop-blur-sm rounded-full mb-6 border border-brand-primary/20 dark:border-brand-primary/30">
            <FileText className="w-8 h-8 text-brand-primary" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Legal terms and conditions for using Staycation Haven services
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-gray max-w-none">
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Last Updated:</strong> January 2026
            </p>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Staycation Haven. By accessing our website and booking our services, you agree to be bound by these Terms of Service. Please read them carefully.
            </p>
          </div>

          <section className="mb-12">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing and using Staycation Haven&apos;s website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.
              </p>
              <p className="text-gray-700 leading-relaxed">
                These Terms of Service apply to all users of the site, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Booking and Reservations</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>All bookings are subject to availability and confirmation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>You must be at least 18 years old to make a booking</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>You must provide accurate and complete information when making a reservation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>We reserve the right to refuse or cancel any booking at our discretion</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>Full payment is required at the time of booking unless otherwise specified</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Pricing and Payment</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>All prices are in Philippine Pesos (PHP) unless otherwise stated</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>Rates are subject to change without prior notice</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>Additional charges may apply for extra services or damages</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>We accept various payment methods as specified on our website</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Cancellation and Refunds</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Cancellations and refunds are governed by our Cancellation Policy. Please review the policy carefully before making a booking.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>Cancellation requests must be made through proper channels</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>Refund amounts depend on cancellation timing as per our policy</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>No-shows are non-refundable</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Guest Conduct</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Guests are expected to:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>Comply with all house rules and regulations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>Respect other guests, staff, and the property</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>Not engage in illegal activities on the premises</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>Be responsible for any damages caused during their stay</span>
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We reserve the right to terminate a guest&apos;s stay immediately without refund for violations of our terms or house rules.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To the fullest extent permitted by law:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>Staycation Haven is not liable for personal injury, property damage, or loss of belongings</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>We are not responsible for interruptions in services due to circumstances beyond our control</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>Our maximum liability is limited to the total amount paid for your booking</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                All content on this website, including text, graphics, logos, images, and software, is the property of Staycation Haven and protected by copyright laws.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You may not reproduce, distribute, modify, or create derivative works without our express written permission.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Your use of our services is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding your personal information.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services after changes are posted constitutes acceptance of the modified terms.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms of Service shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any disputes arising under or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of the Philippines.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="text-gray-700">
                <p><strong>Staycation Haven PH</strong></p>
                <p>Quezon City, Metro Manila, Philippines</p>
                <p>Email: <a href="mailto:support@staycationhaven.ph" className="text-brand-primary hover:underline">support@staycationhaven.ph</a></p>
                <p>Phone: <a href="tel:+639123456789" className="text-brand-primary hover:underline">+63 912 345 6789</a></p>
              </div>
            </div>
          </section>
        </div>

        {/* Contact Support */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About Our Terms?</h2>
          <p className="text-gray-600 mb-6">
            Need clarification on our Terms of Service? Contact our support team.
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

export default TermsOfService;