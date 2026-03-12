'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

const emailEndpoints = [
  {
    path: '/send-booking-email',
    method: 'POST',
    description: 'Send booking confirmation email to guest',
    auth: false,
  },
  {
    path: '/send-checkin-email',
    method: 'POST',
    description: 'Send check-in welcome email',
    auth: false,
  },
  {
    path: '/send-checkout-email',
    method: 'POST',
    description: 'Send check-out/thank you email',
    auth: false,
  },
  {
    path: '/send-down-payment-approval-email',
    method: 'POST',
    description: 'Notify guest of payment approval',
    auth: false,
  },
  {
    path: '/send-pending-email',
    method: 'POST',
    description: 'Send pending booking approval email with receipt',
    auth: false,
  },
];

export default function APIEmailServicesContent() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Email Services API</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">5 endpoints for sending transactional emails</p>

      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 md:p-6 rounded-lg mb-8">
        <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Email Templates</h3>
        <p className="text-sm text-purple-800 dark:text-purple-200">
          All email endpoints send formatted HTML emails. Check the Email Integration Guide for template variables and customization.
        </p>
      </div>

      <div className="space-y-4">
        {emailEndpoints.map((endpoint, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(idx)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 text-left">
                <span className="px-3 py-1 rounded text-xs font-bold text-white bg-blue-500">POST</span>
                <div className="flex-1">
                  <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    https://staycationhavenph.com/api{endpoint.path}
                  </div>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">{endpoint.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-green-600 dark:text-green-400">🔓 Public</span>
                {expandedId === idx ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {expandedId === idx && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">React Native TypeScript</h4>
                  <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`import { emailService } from './services/emailService';

// Send booking confirmation
const sent = await emailService.sendBookingConfirmation({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  roomName: 'Deluxe Suite',
  checkIn: '2024-03-15',
  checkOut: '2024-03-20',
  totalAmount: 5000,
  paymentReference: 'REF-12345'
});

// Check if email was sent
if (sent.success) {
  console.log('Email sent successfully');
} else {
  console.error('Failed to send email:', sent.error);
}`}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
