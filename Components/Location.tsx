'use client';

import { Mail, MapPin, Phone, Clock, Navigation } from 'lucide-react';
import SidebarLayout from '@/Components/SidebarLayout';

const Location = () => {
  return (
    <SidebarLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-12 overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 dark:bg-brand-primary/20 backdrop-blur-sm rounded-full mb-6 border border-brand-primary/20 dark:border-brand-primary/30">
            <MapPin className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Us
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Visit our beautiful location in the heart of Quezon City
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Map Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-12">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
              Our Location
            </h2>
            <p className="text-gray-600 mt-1">Staycation Haven PH, Quezon City, Metro Manila</p>
          </div>

          <div className="w-full h-[500px] bg-gray-200 relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.5889374956847!2d121.03087197584714!3d14.639809577537995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b603c2fec51b%3A0xdf26cdeed4a6fa95!2sStaycation%20Haven%20PH%20Quezon%20City!5e0!3m2!1sen!2sph!4v1234567890123"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Contact Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Address Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-brand-primary transition-colors">
            <div className="bg-orange-100 p-2 sm:p-4 rounded-lg w-fit mb-4">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Address</h3>
            <p className="text-gray-600">
              Staycation Haven PH<br />
              Quezon City<br />
              Metro Manila, Philippines
            </p>
          </div>

          {/* Phone Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-brand-primary transition-colors">
            <div className="bg-orange-100 p-2 sm:p-4 rounded-lg w-fit mb-4">
              <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Phone</h3>
            <p className="text-gray-600 mb-2">+63 9232457609</p>
            <p className="text-sm text-gray-500">Call us anytime</p>
          </div>

          {/* Email Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-brand-primary transition-colors">
            <div className="bg-orange-100 p-2 sm:p-4 rounded-lg w-fit mb-4">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Email</h3>
            <p className="text-gray-600 mb-2">info@staycationhaven.ph</p>
            <p className="text-sm text-gray-500">We&apos;ll respond quickly</p>
          </div>

          {/* Hours Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-brand-primary transition-colors">
            <div className="bg-orange-100 p-2 sm:p-4 rounded-lg w-fit mb-4">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Hours</h3>
            <p className="text-gray-600 text-sm">
              Mon-Fri: 9AM - 6PM<br />
              Sat: 10AM - 4PM<br />
              Sun: Closed
            </p>
          </div>
        </div>

        {/* Directions Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-orange-100 p-2 sm:p-3 rounded-lg">
              <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">How to Get Here</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* By Car */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-orange-100 text-brand-primary px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold">By Car</span>
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary mt-1">•</span>
                  <span>From EDSA: Take the Quezon Avenue exit and head towards East Avenue</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary mt-1">•</span>
                  <span>Ample parking space available on-site</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary mt-1">•</span>
                  <span>GPS coordinates: 14.6398° N, 121.0309° E</span>
                </li>
              </ul>
            </div>

            {/* By Public Transport */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-orange-100 text-brand-primary px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold">Public Transport</span>
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary mt-1">•</span>
                  <span>MRT-3: Alight at Quezon Avenue Station, 10 min walk</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary mt-1">•</span>
                  <span>Bus: Take buses bound for Fairview or SM North EDSA</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary mt-1">•</span>
                  <span>Jeepney: Routes 18, 19, and 20 pass nearby</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">Need help finding us?</p>
            <a
              href="tel:+639232457609"
              className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primaryDark text-white font-bold px-6 py-3 rounded-lg transition-all duration-300"
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Call Us Now</span>
            </a>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Location;
