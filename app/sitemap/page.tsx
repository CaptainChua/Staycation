'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';

const SitemapPage = () => {
  const siteStructure = [
    {
      category: 'Main Pages',
      links: [
        { href: '/', label: 'Home' },
        { href: '/rooms', label: 'Browse Havens' },
        { href: '/about', label: 'About Us' },
        { href: '/location', label: 'Our Locations' },
        { href: '/contacts', label: 'Contact Us' },
      ],
    },
    {
      category: 'User Account',
      links: [
        { href: '/login', label: 'Login' },
        { href: '/profile', label: 'My Profile' },
        { href: '/my-bookings', label: 'My Bookings' },
        { href: '/my-wishlist', label: 'My Wishlist' },
        { href: '/messages', label: 'Messages' },
      ],
    },
    {
      category: 'Policies & Information',
      links: [
        { href: '/booking-policy', label: 'Booking Policy' },
        { href: '/cancellation-policy', label: 'Cancellation Policy' },
        { href: '/payment-options', label: 'Payment Options' },
        { href: '/house-rules', label: 'House Rules' },
        { href: '/terms-of-service', label: 'Terms of Service' },
        { href: '/privacy-policy', label: 'Privacy Policy' },
        { href: '/cookie-policy', label: 'Cookie Policy' },
        { href: '/data-protection', label: 'Data Protection' },
      ],
    },
    {
      category: 'Support & Help',
      links: [
        { href: '/help-center', label: 'Help Center' },
        { href: '/faqs', label: 'Frequently Asked Questions' },
        { href: '/accessibility', label: 'Accessibility' },
      ],
    },
    {
      category: 'Administrative',
      links: [
        { href: '/admin/login', label: 'Admin Login' },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-8 h-8 text-brand-primary" />
            <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white">
              Site Map
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Navigate through all pages and sections of Staycation Haven
          </p>
        </div>

        {/* Sitemap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {siteStructure.map((section) => (
            <div
              key={section.category}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                {section.category}
              </h2>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-brand-primary hover:text-brand-primaryDark dark:hover:text-brand-primary transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-1.5 h-1.5 bg-brand-primary rounded-full group-hover:scale-125 transition-transform flex-shrink-0"></span>
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-2">
            Looking for something specific?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Use our search function or browse through the sections above to find what you need.
          </p>
          <Link
            href="/help-center"
            className="inline-block bg-brand-primary hover:bg-brand-primaryDark text-white px-6 py-2 rounded-lg transition-colors"
          >
            Visit Help Center
          </Link>
        </div>
      </div>
    </main>
  );
};

export default SitemapPage;
