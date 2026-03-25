'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

const pdfEndpoints = [
  {
    path: '/generate-receipt-pdf',
    method: 'POST',
    description: 'Generate booking receipt PDF with QR code',
    auth: false,
  },
];

export default function APIPDFContent() {
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
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">PDF Generation API</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">1 endpoint for generating booking receipts</p>

      <div className="space-y-4">
        {pdfEndpoints.map((endpoint, idx) => (
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
                    <pre>{`import axios from 'axios';
import Share from 'react-native-share';

const generateReceipt = async (bookingData) => {
  try {
    const response = await axios.post(
      'https://staycationhavenph.com/api/generate-receipt-pdf',
      bookingData,
      {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Save or share PDF
    const pdfUrl = URL.createObjectURL(response.data);

    await Share.open({
      url: pdfUrl,
      type: 'application/pdf',
      title: 'Booking Receipt'
    });

  } catch (error) {
    console.error('PDF generation failed:', error);
  }
};`}</pre>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
                  <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Response is PDF binary. Set responseType to 'blob' when making the request.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 md:p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">PDF Features</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
          <li>Formatted receipt with all booking details</li>
          <li>QR code for easy check-in</li>
          <li>Guest information and property details</li>
          <li>Payment summary and booking status</li>
          <li>Company branding and contact info</li>
        </ul>
      </div>
    </div>
  );
}
