'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface Endpoint {
  path: string;
  method: string;
  description: string;
  auth: boolean;
}

const propertiesEndpoints: Endpoint[] = [
  {
    path: '/haven',
    method: 'GET',
    description: 'Get all available properties with filtering and pagination',
    auth: false,
  },
  {
    path: '/haven/[id]',
    method: 'GET',
    description: 'Get detailed information about a specific property',
    auth: false,
  },
  {
    path: '/haven/addHavenRoom',
    method: 'POST',
    description: 'Create a new property/haven',
    auth: true,
  },
];

export default function APIPropertiesContent() {
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
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Properties & Haven API</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">3 endpoints for managing properties and havens</p>

      <div className="space-y-4">
        {propertiesEndpoints.map((endpoint, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(idx)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 text-left">
                <span className={`px-3 py-1 rounded text-xs font-bold text-white ${
                  endpoint.method.includes('GET') ? 'bg-green-500' :
                  endpoint.method.includes('POST') ? 'bg-blue-500' : 'bg-gray-500'
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

                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">React Native TypeScript</h4>
                  <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`import { propertiesService } from './services/propertiesService';

// Get all properties
const properties = await propertiesService.getAllProperties({
  limit: 10,
  page: 1,
  location: 'Boracay'
});

// Get single property
const property = await propertiesService.getPropertyById(5);
console.log(property.name, property.price);`}</pre>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">cURL Example</h4>
                  <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`curl -X GET https://staycationhavenph.com/api${endpoint.path} \\
  -H "Content-Type: application/json"`}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 md:p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Property Details</h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Each property includes images, amenities, pricing, ratings, and availability information.
        </p>
      </div>
    </div>
  );
}
