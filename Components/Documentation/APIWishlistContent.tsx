'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

const wishlistEndpoints = [
  {
    path: '/wishlist',
    method: 'POST',
    description: 'Add property to user wishlist',
    auth: true,
  },
  {
    path: '/wishlist/[userId]',
    method: 'GET',
    description: 'Get user wishlist items',
    auth: true,
  },
  {
    path: '/wishlist/check/[userId]/[havenId]',
    method: 'GET',
    description: 'Check if property is in wishlist',
    auth: true,
  },
  {
    path: '/wishlist/delete/[id]',
    method: 'DELETE',
    description: 'Remove property from wishlist',
    auth: true,
  },
];

export default function APIWishlistContent() {
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
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Wishlist API</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">4 endpoints for managing user wishlists and favorites</p>

      <div className="space-y-4">
        {wishlistEndpoints.map((endpoint, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(idx)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 text-left">
                <span className={`px-3 py-1 rounded text-xs font-bold text-white ${
                  endpoint.method.includes('POST') ? 'bg-blue-500' :
                  endpoint.method.includes('DELETE') ? 'bg-red-500' : 'bg-green-500'
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
                    <pre>{`import { wishlistService } from './services/wishlistService';

// Add to wishlist
const item = await wishlistService.addToWishlist(
  userId,
  havenId
);

// Get wishlist
const wishlist = await wishlistService.getWishlist(userId);

// Check if in wishlist
const isInWishlist = await wishlistService.checkWishlistStatus(
  userId,
  havenId
);

// Remove from wishlist
await wishlistService.removeFromWishlist(wishlistItemId);`}</pre>
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
