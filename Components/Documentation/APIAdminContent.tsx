'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface Endpoint {
  path: string;
  method: string;
  description: string;
  auth: boolean;
  example?: {
    request?: any;
    response?: any;
  };
}

const adminEndpoints: Endpoint[] = [
  {
    path: '/admin/login',
    method: 'POST',
    description: 'Authenticate admin/employee account',
    auth: false,
    example: {
      request: { email: 'admin@example.com', password: 'password123' },
      response: { success: true, user: { id: 1, name: 'Admin', role: 'admin' }, token: 'xyz123' }
    }
  },
  {
    path: '/admin/employees',
    method: 'GET, POST',
    description: 'Manage employee accounts',
    auth: true,
    example: {
      response: { success: true, data: [{ id: 1, name: 'John', email: 'john@example.com', role: 'cleaner' }] }
    }
  },
  {
    path: '/admin/activity-logs',
    method: 'GET, POST, DELETE',
    description: 'Track admin activity and logs',
    auth: true,
    example: {
      response: { success: true, data: [] }
    }
  },
  {
    path: '/admin/analytics/summary',
    method: 'GET',
    description: 'Get dashboard analytics summary',
    auth: true,
    example: {
      response: { success: true, data: { total_revenue: 50000, bookings: 25, users: 100 } }
    }
  },
  {
    path: '/admin/cleaners/tasks',
    method: 'GET',
    description: 'Get all cleaning tasks with filters',
    auth: true,
    example: {
      response: { success: true, data: [{ id: 1, status: 'pending', assigned_to: 5 }] }
    }
  },
  {
    path: '/admin/cleaners/tasks/[id]/assign',
    method: 'PUT',
    description: 'Assign cleaning task to cleaner',
    auth: true,
    example: {
      request: { assigned_to: 5 },
      response: { success: true, data: { id: 1, assigned_to: 5 } }
    }
  },
  {
    path: '/admin/blocked-dates',
    method: 'GET, POST, PUT, DELETE',
    description: 'Manage blocked dates for properties',
    auth: true,
  },
  {
    path: '/admin/discounts',
    method: 'GET, POST, PUT, DELETE, PATCH',
    description: 'Manage discount codes',
    auth: true,
  },
];

export default function APIAdminContent() {
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
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Admin Management API</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">47 endpoints for admin operations and staff management</p>

      <div className="space-y-4">
        {adminEndpoints.map((endpoint, idx) => (
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
                  <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">React Native Example</h4>
                  <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`const response = await apiClient.${endpoint.method.split(',')[0].trim().toLowerCase()}(
  '/admin${endpoint.path}',
  ${JSON.stringify(endpoint.example?.request || {}, null, 2)}
);`}</pre>
                  </div>
                </div>

                {/* cURL Example */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">cURL Example</h4>
                  <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`curl -X ${endpoint.method.split(',')[0].trim()} https://staycationhavenph.com/api/admin${endpoint.path} \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"`}</pre>
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

      <div className="mt-8 p-4 md:p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Need More Endpoints?</h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          View the full Admin API documentation for all 47 endpoints including analytics, inventory management, and more.
        </p>
      </div>
    </div>
  );
}
