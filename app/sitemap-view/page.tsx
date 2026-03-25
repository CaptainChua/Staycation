'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import SidebarLayout from '@/Components/SidebarLayout';

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
  ];

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <MapPin className="w-7 h-7 text-brand-primary" />
          Sitemap
        </h1>
        <div className="space-y-8">
          {siteStructure.map((section) => (
            <div key={section.category}>
              <h2 className="text-xl font-semibold mb-2">{section.category}</h2>
              <ul className="space-y-1">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-brand-primary hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
};

export default SitemapPage;
