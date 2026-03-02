'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

const notificationEndpoints = [
  {
    path: '/notifications',
    method: 'GET, PATCH',
    description: 'Retrieve and update notification status',
    auth: true,
  },
];

export default function APINotificationsContent() {
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
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Notifications API</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">1 endpoint for managing user notifications</p>

      <div className="space-y-4">
        {notificationEndpoints.map((endpoint, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(idx)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 text-left">
                <span className="px-3 py-1 rounded text-xs font-bold text-white bg-green-500">
                  GET
                </span>
                <div className="flex-1">
                  <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    https://staycationhavenph.com/api{endpoint.path}
                  </div>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">{endpoint.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-600 dark:text-red-400">🔐 Auth</span>
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
                    <pre>{`// Get notifications
const notifications = await apiClient.get('/notifications', {
  unreadOnly: true,
  limit: 20,
  offset: 0
});

// Mark as read
await apiClient.patch('/notifications', {
  notificationIds: [1, 2, 3],
  markAs: 'read'
});

// Mark as unread
await apiClient.patch('/notifications', {
  notificationIds: [1],
  markAs: 'unread'
});`}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 md:p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Notification Types</h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Notifications include booking confirmations, payment updates, cleaner assignments, and system alerts.
        </p>
      </div>
    </div>
  );
}
