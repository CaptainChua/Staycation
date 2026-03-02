'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface Endpoint {
  path: string;
  method: string;
  description: string;
  auth: boolean;
}

const authEndpoints: Endpoint[] = [
  {
    path: '/auth/register',
    method: 'POST',
    description: 'Register a new user account with email and password',
    auth: false,
  },
  {
    path: '/auth/delete-account',
    method: 'POST',
    description: 'Permanently delete user account and related data',
    auth: true,
  },
  {
    path: '/auth/[...nextauth]',
    method: 'GET, POST',
    description: 'NextAuth authentication handler for OAuth and sessions',
    auth: false,
  },
];

export default function APIAuthenticationContent() {
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
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Authentication API</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">3 endpoints for user authentication and account management</p>

      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 md:p-6 rounded-lg mb-8">
        <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Authentication Methods</h3>
        <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
          We support multiple authentication methods:
        </p>
        <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1 ml-4">
          <li>• NextAuth OAuth (Google)</li>
          <li>• Email and Password</li>
          <li>• Session-based authentication</li>
        </ul>
      </div>

      <div className="space-y-4">
        {authEndpoints.map((endpoint, idx) => (
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
                    <pre>{`import { authService } from './services/authService';

// Register
const user = await authService.register({
  email: 'user@example.com',
  password: 'secure123',
  name: 'John Doe'
});

// Login
const result = await authService.login({
  email: 'user@example.com',
  password: 'secure123'
});

// Store token
await AsyncStorage.setItem('authToken', result.token);`}</pre>
                  </div>
                </div>

                {/* cURL Example */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">cURL Example</h4>
                  <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`curl -X ${endpoint.method.split(',')[0].trim()} https://staycationhavenph.com/api${endpoint.path} \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "secure123",
    "name": "John Doe"
  }'`}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Authorization Header</h2>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 md:p-6 rounded-lg mb-8">
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
          For authenticated endpoints, include your token in the Authorization header:
        </p>
        <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg font-mono text-xs md:text-sm overflow-x-auto">
          <span className="text-gray-500">Authorization: </span>Bearer YOUR_AUTH_TOKEN
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Session Storage</h2>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 md:p-6 rounded-lg mb-8">
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
          Store and retrieve tokens securely using AsyncStorage:
        </p>
        <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg font-mono text-xs md:text-sm overflow-x-auto">
          <pre>{`import AsyncStorage from '@react-native-async-storage/async-storage';

// Save token
await AsyncStorage.setItem('authToken', token);

// Retrieve token
const token = await AsyncStorage.getItem('authToken');

// Clear token on logout
await AsyncStorage.removeItem('authToken');`}</pre>
        </div>
      </div>

      <div className="mt-8 p-4 md:p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">Security Best Practices</h3>
        <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 ml-4 list-disc">
          <li>Always use HTTPS for authentication requests</li>
          <li>Never log or expose authentication tokens</li>
          <li>Implement token refresh mechanisms</li>
          <li>Validate tokens before using them</li>
          <li>Clear tokens immediately on logout</li>
        </ul>
      </div>
    </div>
  );
}
