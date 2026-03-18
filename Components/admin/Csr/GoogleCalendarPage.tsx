"use client";

export default function GoogleCalendarPage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📅 Google Calendar
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all booking events in real-time
        </p>
      </div>

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
