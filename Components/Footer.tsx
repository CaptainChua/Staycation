"use client";

import { Facebook, Instagram, MapPin, Phone, Mail, HelpCircle, FileText, Shield, ChevronRight, Sun, Moon, Monitor } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import Image from "next/image";

const Footer = () => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <footer className="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-800">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-1">
              <Image
                src="/haven_logo.png"
                alt="Staycation Haven Logo"
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
              />
              <span className="text-xl sm:text-2xl font-display text-brand-primary dark:text-brand-primary relative">
                taycation Haven
                <sup className="text-xs text-brand-primary dark:text-brand-primary ml-0.5 font-normal">PH</sup>
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-light">
              Your perfect city escape awaits. Experience comfort, luxury, and exceptional service at our premium havens.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Staycation Haven PH</p>
                  <p className="text-gray-600 dark:text-gray-400">Quezon City, Metro Manila Philippines</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <a href="tel:+639123456789" className="text-sm hover:text-brand-primary transition-colors text-gray-700 dark:text-gray-300">
                  +63 912 345 6789
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <a href="mailto:info@staycationhaven.ph" className="text-sm hover:text-brand-primary transition-colors text-gray-700 dark:text-gray-300 break-all">
                  info@staycationhaven.ph
                </a>
              </div>
            </div>
          </div>

          {/* Need Help? */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-display font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-primary" />
              Need Help?
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: '/contacts', label: 'Contact Us' },
                { href: '/about', label: 'About Us' },
                { href: '/location', label: 'Our Locations' },
                { href: 'mailto:support@staycationhaven.ph', label: 'Customer Support', isExternal: true },
                { href: '/rooms', label: 'Browse Havens' },
                { href: '/help-center', label: 'Help Center' }
              ].map((item) => (
                <li key={item.label}>
                  {item.isExternal ? (
                    <a
                      href={item.href}
                      className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-1.5 group ${pathname === item.href ? 'text-brand-primary font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                      <span>{item.label}</span>
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-1.5 group ${pathname === item.href ? 'text-brand-primary font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* FAQs & Booking Policy */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-display font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-primary" />
              FAQs & Policies
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: '/faqs', label: 'Frequently Asked Questions' },
                { href: '/booking-policy', label: 'Booking Policy' },
                { href: '/cancellation-policy', label: 'Cancellation Policy' },
                { href: '/payment-options', label: 'Payment Options' },
                { href: '/house-rules', label: 'House Rules' }
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-1.5 group ${pathname === item.href ? 'text-brand-primary font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Terms & Privacy */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-display font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-primary" />
              Terms & Privacy
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: '/terms-of-service', label: 'Terms of Service' },
                { href: '/privacy-policy', label: 'Privacy Policy' },
                { href: '/cookie-policy', label: 'Cookie Policy' },
                { href: '/data-protection', label: 'Data Protection' },
                { href: '/accessibility', label: 'Accessibility' }
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-1.5 group ${pathname === item.href ? 'text-brand-primary font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social Media */}
            <div className="pt-4">
              <p className="text-sm font-display font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Follow Us
              </p>
              <div className="flex gap-3">
                {[
                  { href: 'https://www.facebook.com/staycationhavenph', icon: <Facebook className="w-5 h-5" />, label: 'Facebook' },
                  { href: 'https://www.instagram.com/staycationhavenph/', icon: <Instagram className="w-5 h-5" />, label: 'Instagram' },
                  {
                    href: 'https://www.tiktok.com/@staycationhavenph',
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.68v13.67a2.4 2.4 0 0 1-2.4 2.4 2.4 2.4 0 0 1-2.4-2.4 2.4 2.4 0 0 1 2.4-2.4c.18 0 .37.02.55.05V9.54a6.05 6.05 0 0 0-.55-.05A6.07 6.07 0 0 0 5 15.74a6.06 6.06 0 0 0 6.09 6.05 6.06 6.06 0 0 0 6.09-6.05V8.93a7.72 7.72 0 0 0 3.4 1.94v-3.6a4.27 4.27 0 0 1-.86-.1z" />
                      </svg>
                    ),
                    label: 'TikTok'
                  },
                  { href: 'https://www.google.com/maps/', icon: <MapPin className="w-5 h-5" />, label: 'Location' }
                ].map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-brand-primary hover:bg-brand-primaryDark border border-brand-primary rounded-full flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Single Row Layout: Copyright | Theme Toggle | Links */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
            {/* Left: Copyright */}
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap order-2 lg:order-1">
              &copy; {new Date().getFullYear()} Staycation Haven. All rights reserved.
            </p>

            {/* Center: Theme Toggle */}
            {mounted && (
              <div className="flex justify-center order-1 lg:order-2">
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-1.5 rounded-full transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-white dark:bg-gray-700 text-brand-primary shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    aria-label="Dark mode"
                    title="Dark"
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-1.5 rounded-full transition-all duration-200 ${
                      theme === 'light'
                        ? 'bg-white dark:bg-gray-700 text-brand-primary shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    aria-label="Light mode"
                    title="Light"
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`p-1.5 rounded-full transition-all duration-200 ${
                      theme === 'system'
                        ? 'bg-white dark:bg-gray-700 text-brand-primary shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    aria-label="System mode"
                    title="System"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Right: Links */}
            <div className="flex flex-wrap justify-center lg:justify-end items-center gap-y-2 text-xs sm:text-sm order-3">
              {[
                { href: '/sitemap', label: 'Sitemap' },
                { href: '/accessibility', label: 'Accessibility' },
                { href: '/terms-of-service', label: 'Terms' },
                { href: '/privacy-policy', label: 'Privacy' }
              ].map((item, index) => (
                <div key={item.label} className="flex items-center">
                  {index > 0 && (
                    <span className="text-gray-400 dark:text-gray-600 mx-2 sm:mx-3">•</span>
                  )}
                  <Link
                    href={item.href}
                    className={`hover:text-brand-primary dark:hover:text-brand-primary transition-colors ${pathname === item.href ? 'text-brand-primary font-semibold' : 'text-gray-600 dark:text-gray-400'}`}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
