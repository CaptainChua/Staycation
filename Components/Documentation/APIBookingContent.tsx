'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface Endpoint {
  path: string;
  method: string;
  description: string;
  auth: boolean;
  example?: any;
}

const bookingEndpoints: Endpoint[] = [
  {
    path: '/bookings',
    method: 'GET, POST, PUT, DELETE',
    description: 'Complete booking CRUD operations with filters and pagination',
    auth: true,
    example: {
      request: {
        POST: { user_id: 1, haven_id: 5, check_in: '2024-03-15', check_out: '2024-03-20', guests: 2, total_price: 5000 }
      },
      response: { success: true, data: { id: 101, status: 'pending', total_price: 5000 } }
    }
  },
  {
    path: '/bookings/[id]',
    method: 'GET, PUT, PATCH, DELETE',
    description: 'Get or update individual booking details',
    auth: true,
    example: {
      response: { success: true, data: { id: 101, status: 'confirmed', total_price: 5000, guests: 2 } }
    }
  },
  {
    path: '/bookings/user/[userId]',
    method: 'GET',
    description: 'Get all bookings for a specific user',
    auth: true,
    example: {
      response: { success: true, data: [{ id: 101, status: 'confirmed' }, { id: 102, status: 'pending' }] }
    }
  },
  {
    path: '/bookings/search',
    method: 'GET',
    description: 'Search bookings by ID or criteria',
    auth: true,
  },
  {
    path: '/bookings/room/[havenId]',
    method: 'GET',
    description: 'Get all bookings for a specific property/room',
    auth: true,
  },
  {
    path: '/bookings/[id]/cleaning',
    method: 'PUT',
    description: 'Update cleaning status for a booking',
    auth: true,
    example: {
      request: { cleaning_status: 'cleaned' },
      response: { success: true, data: { id: 101, cleaning_status: 'cleaned' } }
    }
  },
];

export default function APIBookingContent() {
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
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Booking Management API</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">6 endpoints for managing the complete booking lifecycle</p>

      <div className="space-y-4">
        {bookingEndpoints.map((endpoint, idx) => (
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
                  endpoint.method.includes('DELETE') ? 'bg-red-500' : 'bg-gray-500'
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
                  <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">React Native Typescript</h4>
                  <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`import { bookingsService } from './services/bookingsService';

const booking = await bookingsService.createBooking({
  haven_id: 5,
  user_id: 1,
  check_in: '2024-03-15',
  check_out: '2024-03-20',
  guests: 2,
  total_price: 5000,
});`}</pre>
                  </div>
                </div>

                {/* cURL Example */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">cURL Example</h4>
                  <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`curl -X ${endpoint.method.split(',')[0].trim()} https://staycationhavenph.com/api${endpoint.path} \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{}'`}</pre>
                  </div>
                </div>

                {/* Response Example */}
                {endpoint.example?.response && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">Response Example</h4>
                    <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                      <pre>{JSON.stringify(endpoint.example.response, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 md:p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">Booking Workflow</h3>
        <p className="text-sm text-green-800 dark:text-green-200">
          For a complete guide on the booking workflow, including payment processing and status transitions, check the Booking System Guide in documentation.
        </p>
      </div>
    </div>
  );
}
