'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

const oauthEndpoints = [
  {
    path: '/google-login',
    method: 'GET, POST',
    description: 'Handle Google OAuth authentication flow',
    auth: false,
  },
];

export default function APIOAuthContent() {
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
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">OAuth & Social Login API</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">1 endpoint for Google OAuth authentication</p>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 md:p-6 rounded-lg mb-8">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">OAuth Flow</h3>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
          Implements secure OAuth 2.0 authentication with Google. Automatically creates user accounts on first login.
        </p>
        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-decimal">
          <li>User clicks "Login with Google"</li>
          <li>Google authentication modal opens</li>
          <li>User logs in and grants permissions</li>
          <li>Server receives OAuth token</li>
          <li>User account created or retrieved</li>
          <li>Session token returned to client</li>
        </ol>
      </div>

      <div className="space-y-4">
        {oauthEndpoints.map((endpoint, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(idx)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 text-left">
                <span className="px-3 py-1 rounded text-xs font-bold text-white bg-green-500">GET</span>
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
                    <pre>{`import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

GoogleSignin.configure({
  scopes: ['profile', 'email'],
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com'
});

const handleGoogleLogin = async () => {
  try {
    // Sign in with Google
    const userInfo = await GoogleSignin.signIn();

    // Send token to backend
    const response = await apiClient.post(
      '/google-login',
      { token: userInfo.idToken }
    );

    // Save session
    await AsyncStorage.setItem(
      'authToken',
      response.data.token
    );

    navigation.navigate('Home');
  } catch (error) {
    console.error('Google login failed:', error);
  }
};`}</pre>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
                  <p className="text-xs md:text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Required:</strong> Install @react-native-google-signin/google-signin and configure with your Google OAuth credentials.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
