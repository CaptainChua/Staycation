'use client';

import React from 'react';
import {
  BookOpen,
  Server,
  Lock,
  Zap,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight
} from 'lucide-react';

export default function APIOverviewContent() {
  return (
    <div className="w-full">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">API Documentation</h1>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <p className="text-base md:text-lg text-blue-900 dark:text-blue-100">
            <strong>Welcome to the Staycation API!</strong> This comprehensive guide covers all 91 endpoints for integrating with our platform.
          </p>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Base URL</h2>
      <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 md:p-6 rounded-lg mb-8 font-mono text-sm md:text-base overflow-x-auto">
        https://staycationhavenph.com/api/
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">API Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg text-center">
          <div className="text-2xl md:text-3xl font-bold text-brand-primary mb-2">91</div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total Endpoints</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg text-center">
          <div className="text-2xl md:text-3xl font-bold text-brand-primary mb-2">17</div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Categories</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg text-center">
          <div className="text-2xl md:text-3xl font-bold text-brand-primary mb-2">60+</div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Authenticated</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg text-center">
          <div className="text-2xl md:text-3xl font-bold text-brand-primary mb-2">~15</div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Public</div>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Key Features</h2>
      <div className="space-y-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 md:p-5 rounded-lg">
          <div className="flex items-start gap-3">
            <Server className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">RESTful API</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Standard HTTP methods (GET, POST, PUT, PATCH, DELETE)</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 md:p-5 rounded-lg">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Secure Authentication</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">NextAuth sessions and token-based authentication</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 md:p-5 rounded-lg">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Fast Response Times</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Optimized queries and caching for optimal performance</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 md:p-5 rounded-lg">
          <div className="flex items-start gap-3">
            <Code2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Comprehensive Examples</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">React Native TypeScript and cURL examples for each endpoint</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">API Categories</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <a href="/documentation/api/admin" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-primary dark:hover:border-brand-primaryLight p-4 rounded-lg transition-colors group">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Admin Management</h3>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
          </div>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-2">47 endpoints for admin operations</p>
        </a>

        <a href="/documentation/api/booking" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-primary dark:hover:border-brand-primaryLight p-4 rounded-lg transition-colors group">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Booking Management</h3>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
          </div>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-2">6 endpoints for booking operations</p>
        </a>

        <a href="/documentation/api/payment" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-primary dark:hover:border-brand-primaryLight p-4 rounded-lg transition-colors group">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Payment Management</h3>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
          </div>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-2">5 endpoints for payment processing</p>
        </a>

        <a href="/documentation/api/authentication" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-primary dark:hover:border-brand-primaryLight p-4 rounded-lg transition-colors group">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Authentication</h3>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
          </div>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-2">3 endpoints for auth operations</p>
        </a>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Authentication</h2>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 md:p-6 rounded-lg mb-8">
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
          Most endpoints require authentication. Include your token in the Authorization header:
        </p>
        <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg font-mono text-xs md:text-sm overflow-x-auto">
          <span className="text-gray-500">Authorization: Bearer </span>YOUR_TOKEN_HERE
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Response Format</h2>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 md:p-6 rounded-lg mb-8">
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
          All responses follow this format:
        </p>
        <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg font-mono text-xs md:text-sm overflow-x-auto">
          <pre>{`{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "message": "Optional success message"
}`}</pre>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base md:text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Rate Limiting</h3>
            <p className="text-sm md:text-base text-yellow-900 dark:text-yellow-200">
              Some endpoints may have rate limits. If you receive a 429 (Too Many Requests) response, wait before making more requests.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 p-4 md:p-6 bg-gradient-to-r from-brand-primaryLighter to-brand-primarySoft dark:from-gray-800 dark:to-gray-700 rounded-lg border border-brand-primaryLight dark:border-gray-600">
        <div className="flex items-start gap-3 mb-3">
          <BookOpen className="w-6 h-6 text-brand-primaryDark dark:text-brand-primaryLight flex-shrink-0" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">Explore Endpoints</h3>
        </div>
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
          Choose a category from the left menu to explore all available endpoints with examples.
        </p>
        <a
          href="/documentation/api/admin"
          className="inline-block bg-brand-primary hover:bg-brand-primaryDark text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors text-sm md:text-base"
        >
          View Admin Endpoints →
        </a>
      </div>
    </div>
  );
}
