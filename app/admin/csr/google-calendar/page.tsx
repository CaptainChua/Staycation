"use client";

import { useState } from "react";
import { useSyncCalendarBookingsMutation } from "@/redux/api/bookingsApi";

export default function GoogleCalendarPage() {
  const [syncCalendarBookings, { isLoading: isSyncing }] = useSyncCalendarBookingsMutation();
  const [syncResult, setSyncResult] = useState<{
    message: string;
    synced: number;
    failed: number;
    total: number;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncResult(null);
    setSyncError(null);
    try {
      const result = await syncCalendarBookings().unwrap();
      setSyncResult({
        message: result.message,
        synced: result.synced,
        failed: result.failed,
        total: result.total,
      });
    } catch (err: any) {
      setSyncError(err?.data?.error || "Failed to sync bookings to Google Calendar.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              📅 Google Calendar
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all booking events in real-time
            </p>
          </div>

          {/* Sync Button */}
          <div className="flex flex-col items-start md:items-end gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {isSyncing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Old Bookings to Calendar
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Generates calendar events for bookings missing a Google Event ID
            </p>
          </div>
        </div>

        {/* Sync Result Banner */}
        {syncResult && (
          <div className={`mb-4 rounded-lg p-4 border ${
            syncResult.failed > 0
              ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
              : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
          }`}>
            <p className={`font-semibold ${syncResult.failed > 0 ? "text-yellow-800 dark:text-yellow-200" : "text-green-800 dark:text-green-200"}`}>
              {syncResult.total === 0
                ? "✅ All bookings are already synced to Google Calendar."
                : syncResult.message}
            </p>
            {syncResult.total > 0 && (
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-green-700 dark:text-green-300">✅ Synced: {syncResult.synced}</span>
                {syncResult.failed > 0 && (
                  <span className="text-red-600 dark:text-red-400">❌ Failed: {syncResult.failed}</span>
                )}
                <span className="text-gray-600 dark:text-gray-400">Total: {syncResult.total}</span>
              </div>
            )}
          </div>
        )}

        {syncError && (
          <div className="mb-4 rounded-lg p-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200 font-semibold">❌ {syncError}</p>
          </div>
        )}

        {/* Calendar Container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="w-full overflow-x-auto">
            <iframe
              src="https://calendar.google.com/calendar/embed?src=staycationhaven9%40gmail.com&ctz=Asia%2FManila"
              style={{
                border: 0,
                width: "100%",
                minHeight: "600px",
              }}
              frameBorder="0"
              scrolling="no"
              title="Staycation Haven Booking Calendar"
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
              📌 About This Calendar
            </h3>
            <p className="text-blue-800 dark:text-blue-300">
              This calendar displays all booking events from your system. Each event shows:
            </p>
            <ul className="list-disc list-inside mt-3 text-blue-800 dark:text-blue-300 space-y-1">
              <li>Booking dates and guest names</li>
              <li>Room information</li>
              <li>Booking status (pending, approved, confirmed)</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-2">
              ✨ Key Features
            </h3>
            <ul className="space-y-2 text-green-800 dark:text-green-300">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                Real-time updates
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                Month, week, and day views
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                Easy event navigation
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                Timezone: Asia/Manila
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
