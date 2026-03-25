'use client';

import React from 'react';
import Link from 'next/link';
import {
  Home,
  Bed,
  Mail,
  MapPin,
  Info,
  Calendar,
  Heart,
  HelpCircle,
  FileText,
  User,
  Settings
} from 'lucide-react';

export default function WebsiteNavigationContent() {
  const publicPages = [
    { name: 'Home', path: '/', icon: Home, description: 'Main landing page showcasing featured havens' },
    { name: 'Havens (Rooms)', path: '/rooms', icon: Bed, description: 'Browse all available rooms and accommodations' },
    { name: 'Contacts', path: '/contacts', icon: Mail, description: 'Get in touch with our team' },
    { name: 'Location', path: '/location', icon: MapPin, description: 'Find our physical locations' },
    { name: 'About', path: '/about', icon: Info, description: 'Learn about Staycation Haven' },
  ];

  const userPages = [
    { name: 'My Bookings', path: '/mybookings', icon: Calendar, description: 'View and manage your reservations' },
    { name: 'My Wishlist', path: '/mywishlist', icon: Heart, description: 'Saved rooms and favorites' },
  ];

  const helpPages = [
    { name: 'Help Center', path: '/help-center', icon: HelpCircle, description: 'Get assistance and support' },
    { name: 'FAQs', path: '/faqs', icon: HelpCircle, description: 'Frequently asked questions' },
  ];

  const policyPages = [
    { name: 'Booking Policy', path: '/booking-policy', icon: FileText, description: 'Booking terms and conditions' },
    { name: 'Cancellation Policy', path: '/cancellation-policy', icon: FileText, description: 'Cancellation and refund information' },
    { name: 'House Rules', path: '/house-rules', icon: FileText, description: 'Rules and regulations for guests' },
    { name: 'Payment Options', path: '/payment-options', icon: FileText, description: 'Available payment methods' },
    { name: 'Privacy Policy', path: '/privacy-policy', icon: FileText, description: 'How we handle your data' },
    { name: 'Terms of Service', path: '/terms-of-service', icon: FileText, description: 'Terms and conditions' },
  ];

  const adminPages = [
    { name: 'Admin Dashboard', path: '/admin', icon: Settings, description: 'Admin control panel (restricted)' },
    { name: 'Admin Login', path: '/admin/login', icon: User, description: 'Admin authentication page' },
  ];

  return (
    <div className="prose max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Website Navigation Guide</h1>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-6 mb-8">
        <p className="text-lg text-blue-900 dark:text-blue-100">
          This guide helps you navigate through all the pages in the Staycation Haven website.
          Click on any page link to visit it directly.
        </p>
      </div>

      {/* Public Pages */}
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Public Pages</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        These pages are accessible to everyone visiting the website.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {publicPages.map((page) => {
          const Icon = page.icon;
          return (
            <Link
              key={page.path}
              href={page.path}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-brand-primary dark:hover:border-brand-primaryLight hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand-primaryLight dark:bg-brand-primaryDark rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-primaryDark dark:text-brand-primaryLight" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-brand-primary dark:group-hover:text-brand-primaryLight transition-colors">
                    {page.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{page.description}</p>
                  <span className="text-xs text-brand-primary dark:text-brand-primaryLight font-mono">{page.path}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* User Account Pages */}
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">User Account Pages</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        These pages require user authentication to access.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {userPages.map((page) => {
          const Icon = page.icon;
          return (
            <Link
              key={page.path}
              href={page.path}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-brand-primary dark:hover:border-brand-primaryLight hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand-primaryLight dark:bg-brand-primaryDark rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-primaryDark dark:text-brand-primaryLight" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-brand-primary dark:group-hover:text-brand-primaryLight transition-colors">
                    {page.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{page.description}</p>
                  <span className="text-xs text-brand-primary dark:text-brand-primaryLight font-mono">{page.path}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Help & Support Pages */}
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Help & Support</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        Resources to help you with common questions and issues.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {helpPages.map((page) => {
          const Icon = page.icon;
          return (
            <Link
              key={page.path}
              href={page.path}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-brand-primary dark:hover:border-brand-primaryLight hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand-primaryLight dark:bg-brand-primaryDark rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-primaryDark dark:text-brand-primaryLight" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-brand-primary dark:group-hover:text-brand-primaryLight transition-colors">
                    {page.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{page.description}</p>
                  <span className="text-xs text-brand-primary dark:text-brand-primaryLight font-mono">{page.path}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Policies & Legal Pages */}
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Policies & Legal</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        Important policies and legal information.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {policyPages.map((page) => {
          const Icon = page.icon;
          return (
            <Link
              key={page.path}
              href={page.path}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-brand-primary dark:hover:border-brand-primaryLight hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand-primaryLight dark:bg-brand-primaryDark rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-primaryDark dark:text-brand-primaryLight" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-brand-primary dark:group-hover:text-brand-primaryLight transition-colors">
                    {page.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{page.description}</p>
                  <span className="text-xs text-brand-primary dark:text-brand-primaryLight font-mono">{page.path}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Admin Pages */}
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Admin Pages</h2>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-6 mb-6">
        <p className="text-yellow-900 dark:text-yellow-100">
          <strong>Restricted Access:</strong> These pages are only accessible to administrators.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {adminPages.map((page) => {
          const Icon = page.icon;
          return (
            <Link
              key={page.path}
              href={page.path}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-brand-primary dark:hover:border-brand-primaryLight hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand-primaryLight dark:bg-brand-primaryDark rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-primaryDark dark:text-brand-primaryLight" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-brand-primary dark:group-hover:text-brand-primaryLight transition-colors">
                    {page.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{page.description}</p>
                  <span className="text-xs text-brand-primary dark:text-brand-primaryLight font-mono">{page.path}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-gradient-to-r from-brand-primaryLighter to-brand-primarySoft dark:from-gray-800 dark:to-gray-700 rounded-lg border border-brand-primaryLight dark:border-gray-600">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Navigation Tips</h3>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li className="flex gap-2">
            <span className="text-brand-primary dark:text-brand-primaryLight">→</span>
            <span>All page links are clickable and will navigate you to that page</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-primary dark:text-brand-primaryLight">→</span>
            <span>Use the browser back button to return to this documentation</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-primary dark:text-brand-primaryLight">→</span>
            <span>User pages require login - you&apos;ll be redirected to sign in first</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-primary dark:text-brand-primaryLight">→</span>
            <span>Admin pages are protected and require admin credentials</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
