"use client";

import { Metadata } from "next";

export default function GoogleCalendarPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📅 Google Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all booking events in real-time
          </p>
        </div>

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
