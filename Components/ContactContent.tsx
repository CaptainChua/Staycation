'use client';

import SidebarLayout from "@/Components/SidebarLayout";
import { Mail, MapPin, Phone, Send } from 'lucide-react';

interface ContactContentProps {
  className?: string;
}

const ContactContent = ({ className = "" }: ContactContentProps) => {
  return (
    <SidebarLayout>
      <div className={className}>
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-12 overflow-hidden border-b border-gray-200 dark:border-gray-700">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 dark:bg-brand-primary/20 backdrop-blur-sm rounded-full mb-6 border border-brand-primary/20 dark:border-brand-primary/30">
              <Mail className="w-8 h-8 text-brand-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Get In Touch
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Contact Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">Send Us a Message</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Fill out the form below and we&apos;ll get back to you shortly.</p>

              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-brand-primary focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 text-base outline-none text-gray-700 dark:text-white py-3 px-4 transition-colors duration-200"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-brand-primary focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 text-base outline-none text-gray-700 dark:text-white py-3 px-4 transition-colors duration-200"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-brand-primary focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 text-base outline-none text-gray-700 dark:text-white py-3 px-4 transition-colors duration-200"
                    placeholder="+63 912 345 6789"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-brand-primary focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 text-base outline-none text-gray-700 dark:text-white py-3 px-4 resize-none transition-colors duration-200"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Information</h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2 sm:p-3 rounded-lg">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">Address</h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        Staycation Haven PH<br />
                        Quezon City<br />
                        Metro Manila, Philippines
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2 sm:p-3 rounded-lg">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">Phone</h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">+63 9232457609</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2 sm:p-3 rounded-lg">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">Email</h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">info@staycationhaven.ph</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Business Hours</h3>
                  <div className="space-y-2 text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Monday - Friday:</span>
                      <span className="font-medium">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday:</span>
                      <span className="font-medium">10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday:</span>
                      <span className="font-medium">Closed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ContactContent;