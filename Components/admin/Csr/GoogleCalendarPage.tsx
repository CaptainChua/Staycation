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
    errors?: string[];
    sampleLink?: string;
    calendarId?: string;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncResult(null);
    setSyncError(null);
    try {
      const result = await syncCalendarBookings().unwrap();
      const anyResult = result as any;
      const firstSynced = anyResult.results?.find((r: any) => r.status === "synced");
      setSyncResult({
        message: result.message,
        synced: result.synced,
        failed: result.failed,
        total: result.total,
        errors: anyResult.errors,
        sampleLink: firstSynced?.html_link ?? undefined,
        calendarId: firstSynced?.calendar_id ?? undefined,
      });
    } catch (err: any) {
      // The backend returns error details in err.data
      const detail = err?.data?.error || err?.data?.message || "Failed to sync bookings to Google Calendar.";
      setSyncError(detail);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📅 Google Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all booking events in real-time
          </p>
        </div>

        {/* Sync Button */}
        <div className="flex flex-col items-start sm:items-end gap-1">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors shadow-sm text-sm"
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
          syncResult.failed > 0 && syncResult.synced === 0
            ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
            : syncResult.failed > 0
            ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
            : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
        }`}>
          <p className={`font-semibold text-sm ${
            syncResult.failed > 0 && syncResult.synced === 0
              ? "text-red-800 dark:text-red-200"
              : syncResult.failed > 0
              ? "text-yellow-800 dark:text-yellow-200"
              : "text-green-800 dark:text-green-200"
          }`}>
            {syncResult.total === 0
              ? "✅ All bookings are already synced to Google Calendar."
              : syncResult.message}
          </p>
          {syncResult.total > 0 && (
            <div className="mt-1 flex gap-4 text-sm">
              <span className="text-green-700 dark:text-green-300">✅ Synced: {syncResult.synced}</span>
              {syncResult.failed > 0 && (
                <span className="text-red-600 dark:text-red-400">❌ Failed: {syncResult.failed}</span>
              )}
              <span className="text-gray-600 dark:text-gray-400">Total: {syncResult.total}</span>
            </div>
          )}
          {/* Show which calendar was used — mismatch here explains why events don't appear */}
          {syncResult.calendarId && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Events created on calendar: <span className="font-mono font-semibold">{syncResult.calendarId}</span>
              {syncResult.sampleLink && (
                <> — <a href={syncResult.sampleLink} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400">View sample event</a></>
              )}
            </p>
          )}
          {/* Show the actual error reason so you know what to fix */}
          {syncResult.errors && syncResult.errors.length > 0 && (
            <div className="mt-3 border-t border-red-200 dark:border-red-700 pt-3">
              <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Error reason(s):</p>
              {syncResult.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-700 dark:text-red-300 font-mono break-all">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {syncError && (
        <div className="mb-4 rounded-lg p-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200 font-semibold text-sm">❌ Error</p>
          <p className="text-red-700 dark:text-red-300 text-xs font-mono mt-1 break-all">{syncError}</p>
        </div>
      )}

      {/* Calendar Iframe */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="w-full overflow-x-auto">
          <iframe
            src="https://calendar.google.com/calendar/embed?src=staycationhaven9%40gmail.com&ctz=Asia%2FManila"
            style={{
              border: 0,
              width: "100%",
              minHeight: "700px",
            }}
            frameBorder="0"
            scrolling="no"
            title="Staycation Haven Booking Calendar"
          />
        </div>
      </div>
    </div>
  );
}
