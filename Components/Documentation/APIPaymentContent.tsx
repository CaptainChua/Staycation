'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface Endpoint {
  path: string;
  method: string;
  description: string;
  auth: boolean;
}

const paymentEndpoints: Endpoint[] = [
  {
    path: '/booking-payments',
    method: 'GET, POST',
    description: 'Manage booking payments with filters and search',
    auth: true,
  },
  {
    path: '/booking-payments/[id]',
    method: 'GET, PUT, PATCH, DELETE',
    description: 'Get or update individual payment records',
    auth: true,
  },
  {
    path: '/payment-methods',
    method: 'GET, POST',
    description: 'Retrieve or create payment methods with QR codes',
    auth: true,
  },
  {
    path: '/payment-methods/[id]',
    method: 'PUT, DELETE',
    description: 'Update or delete payment method with image support',
    auth: true,
  },
  {
    path: '/payment-methods/[id]/toggle-status',
    method: 'PATCH',
    description: 'Enable or disable a payment method',
    auth: true,
  },
];

export default function APIPaymentContent() {
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
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Payment Management API</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">5 endpoints for processing payments and managing payment methods</p>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 md:p-6 rounded-lg mb-8">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Payment Processing</h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          These endpoints handle payment collection, storage, and verification. Supports multiple payment methods including GCash, BankTransfer, and more.
        </p>
      </div>

      <div className="space-y-4">
        {paymentEndpoints.map((endpoint, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(idx)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 text-left">
                <span className={`px-3 py-1 rounded text-xs font-bold text-white ${
                  endpoint.method.includes('GET') ? 'bg-green-500' :
                  endpoint.method.includes('POST') ? 'bg-blue-500' :
                  endpoint.method.includes('PUT') ? 'bg-yellow-500' :
                  endpoint.method.includes('DELETE') ? 'bg-red-500' :
                  endpoint.method.includes('PATCH') ? 'bg-purple-500' : 'bg-gray-500'
                }`}>
                  {endpoint.method.split(',')[0].trim()}
                </span>
                <div className="flex-1">
                  <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    https://staycationhavenph.com/api{endpoint.path}
                  </div>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">{endpoint.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${endpoint.auth ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {endpoint.auth ? '🔐 Auth' : '🔓 Public'}
                </span>
                {expandedId === idx ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {expandedId === idx && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 space-y-4">
                {/* Methods */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">Methods</h4>
                  <div className="flex flex-wrap gap-2">
                    {endpoint.method.split(',').map((method, i) => (
                      <span key={i} className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-white">
                        {method.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Full URL */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">Full URL</h4>
                  <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto flex items-center justify-between">
                    <span>https://staycationhavenph.com/api{endpoint.path}</span>
                    <button
                      onClick={() => copyToClipboard(`https://staycationhavenph.com/api${endpoint.path}`, idx)}
                      className="ml-2 text-gray-500 hover:text-white"
                    >
                      {copiedId === idx ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* React Native Example */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">React Native TypeScript</h4>
                  <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`import { paymentsService } from './services/paymentsService';

try {
  const payment = await paymentsService.createPayment({
    booking_id: 101,
    amount: 2500,
    payment_method: 'gcash',
    reference_number: 'REF-12345'
  });
  console.log('Payment created:', payment);
} catch (error) {
  console.error('Payment failed:', error);
}`}</pre>
                  </div>
                </div>

                {/* cURL Example */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">cURL Example</h4>
                  <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`curl -X ${endpoint.method.split(',')[0].trim()} https://staycationhavenph.com/api${endpoint.path} \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "booking_id": 101,
    "amount": 2500,
    "payment_method": "gcash"
  }'`}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Supported Payment Methods</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">GCash</h4>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Mobile wallet payment</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">BankTransfer</h4>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Bank account transfer</p>
        </div>
      </div>

      <div className="mt-8 p-4 md:p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Important: Secure Handling</h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Always handle payment data securely. Never log sensitive information like credit card details. Use HTTPS for all payment requests.
        </p>
      </div>
    </div>
  );
}
