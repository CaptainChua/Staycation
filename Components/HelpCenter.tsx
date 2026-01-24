"use client";

import { Mail, Phone, MessageCircle, Clock, HelpCircle } from "lucide-react";
import Link from "next/link";
import SidebarLayout from "./SidebarLayout";

const HelpCenter = () => {
  return (
    <SidebarLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-12 overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 dark:bg-brand-primary/20 backdrop-blur-sm rounded-full mb-6 border border-brand-primary/20 dark:border-brand-primary/30">
            <HelpCircle className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Help Center
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get 24/7 support for all your staycation needs
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Call Us</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Talk to our support team</p>
            <a href="tel:+639123456789" className="text-brand-primary hover:text-brand-primaryDark font-medium">
              +63 912 345 6789
            </a>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Email Us</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Get a response within 24 hours</p>
            <a href="mailto:support@staycationhaven.ph" className="text-brand-primary hover:text-brand-primaryDark font-medium break-all">
              support@staycationhaven.ph
            </a>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Live Chat</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Chat with our team now</p>
            <button className="text-brand-primary hover:text-brand-primaryDark font-medium">
              Start Chat
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Support Hours</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">We&apos;re available 24/7</p>
            <p className="text-gray-900 dark:text-white font-medium">Always Open</p>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/contacts" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-primary hover:shadow-md transition-all group">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand-primary transition-colors">Contact Us</h3>
              <p className="text-gray-600 text-sm">Get in touch with our team</p>
            </Link>

            <Link href="/about" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-primary hover:shadow-md transition-all group">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand-primary transition-colors">About Us</h3>
              <p className="text-gray-600 text-sm">Learn more about us</p>
            </Link>

            <Link href="/location" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-primary hover:shadow-md transition-all group">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand-primary transition-colors">Our Locations</h3>
              <p className="text-gray-600 text-sm">Find havens near you</p>
            </Link>

            <Link href="/rooms" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-primary hover:shadow-md transition-all group">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand-primary transition-colors">Browse Havens</h3>
              <p className="text-gray-600 text-sm">Explore available rooms</p>
            </Link>
          </div>
        </div>

        {/* FAQs & Policies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">FAQs & Policies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/faqs" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-primary hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Frequently Asked Questions</h3>
              <p className="text-gray-600 text-sm">Find quick answers to common questions</p>
            </Link>

            <Link href="/booking-policy" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-primary hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Policy</h3>
              <p className="text-gray-600 text-sm">Learn about our booking process and requirements</p>
            </Link>

            <Link href="/cancellation-policy" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-primary hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancellation Policy</h3>
              <p className="text-gray-600 text-sm">Understand our cancellation terms and refunds</p>
            </Link>

            <Link href="/payment-options" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-primary hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Options</h3>
              <p className="text-gray-600 text-sm">See available payment methods</p>
            </Link>

            <Link href="/house-rules" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-primary hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">House Rules</h3>
              <p className="text-gray-600 text-sm">Review our guest guidelines</p>
            </Link>
          </div>
        </div>

        {/* Terms & Privacy */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Terms & Privacy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/terms-of-service" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-primary hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms of Service</h3>
              <p className="text-gray-600 text-sm">Read our terms and conditions</p>
            </Link>

            <Link href="/privacy-policy" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-primary hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy Policy</h3>
              <p className="text-gray-600 text-sm">Learn how we protect your data</p>
            </Link>

            <Link href="/cookie-policy" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-primary hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookie Policy</h3>
              <p className="text-gray-600 text-sm">Understand our cookie usage</p>
            </Link>

            <Link href="/data-protection" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-primary hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Protection</h3>
              <p className="text-gray-600 text-sm">See how we handle your information</p>
            </Link>

            <Link href="/accessibility" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-primary hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Accessibility</h3>
              <p className="text-gray-600 text-sm">Our commitment to accessibility</p>
            </Link>
          </div>
        </div>

        {/* Still Need Help */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
          <p className="text-gray-600 mb-6">
            Can&apos;t find what you&apos;re looking for? Our support team is here to assist you.
          </p>
          <Link href="/contacts" className="inline-block bg-brand-primary hover:bg-brand-primaryDark text-white px-8 py-3 rounded-lg font-medium transition-colors">
            Contact Support
          </Link>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default HelpCenter;
