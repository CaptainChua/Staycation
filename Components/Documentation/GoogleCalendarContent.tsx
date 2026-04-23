'use client';

/* eslint-disable react/no-unescaped-entities */

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { InfoCard, CodeBlock, Step } from './DocComponents';

export default function GoogleCalendarContent() {
  return (
    <div className="w-full">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">Current Setup Using staycationhaven9@gmail.com</h1>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <p className="text-base md:text-lg text-blue-900 dark:text-blue-100">
            <strong>How it works:</strong> When a guest submits a booking, the system automatically creates a Google Calendar event with all booking details — even while the booking is still <strong>Pending</strong>. This helps the admin team track upcoming reservations in real time.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">How It Works</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
        The system uses a <strong>Google Service Account</strong> to automatically create calendar events on your behalf. You do not need to be logged in — the service account acts as an automated agent that creates events directly in your Google Calendar.
      </p>

      <div className="space-y-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border-l-4 border-brand-primary p-4 md:p-5 rounded-r-lg shadow-sm">
          <div className="flex items-start gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Guest submits booking</h3>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            The guest fills out the checkout form and clicks "Confirm Booking".
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border-l-4 border-brand-primary p-4 md:p-5 rounded-r-lg shadow-sm">
          <div className="flex items-start gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Payment proof is uploaded</h3>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            If the guest uploaded a payment proof (e.g., GCash screenshot), it is uploaded to Cloudinary first to get a URL.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border-l-4 border-brand-primary p-4 md:p-5 rounded-r-lg shadow-sm">
          <div className="flex items-start gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Calendar event is created</h3>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            The system creates a Google Calendar event with the booking details including check-in/check-out dates, guest info, payment method, and a link to the payment proof.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border-l-4 border-brand-primary p-4 md:p-5 rounded-r-lg shadow-sm">
          <div className="flex items-start gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Booking is saved to database</h3>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            The booking record (including the <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">google_event_id</code>) is saved to the database.
          </p>
        </div>
      </div>

      {/* What the Calendar Event Shows */}
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-10 mb-4">What the Calendar Event Contains</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Each calendar event automatically displays the following information:
      </p>

      <CodeBlock title="Example Calendar Event Description">
        <div className="space-y-1 text-sm">
          <p className="text-green-400">📋 BOOKING DETAILS</p>
          <p>Booking ID: BK1773816121474</p>
          <p>Status: pending</p>
          <p>Stay Type: Overnight</p>
          <br />
          <p className="text-green-400">📅 DATES & TIMES</p>
          <p>Check-in: March 20, 2026 at 2:00 PM</p>
          <p>Check-out: March 22, 2026 at 12:00 PM</p>
          <br />
          <p className="text-green-400">👥 GUEST INFORMATION</p>
          <p>Name: Juan Dela Cruz</p>
          <p>Email: juan@example.com</p>
          <p>Phone: +63 912 345 6789</p>
          <p>Adults: 2 | Children: 1 | Infants: 0</p>
          <br />
          <p className="text-green-400">💳 PAYMENT INFORMATION</p>
          <p>Total Amount: ₱25,000.00</p>
          <p>Down Payment: ₱5,000.00</p>
          <p>Payment Method: GCash</p>
          <p>Payment Proof: https://res.cloudinary.com/.../payment-proof.jpg</p>
        </div>
      </CodeBlock>

      {/* How I Implemented */}
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-10 mb-4">
        How I Implemented Google Calendar
      </h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
        Here is a breakdown of what I did to set up the Google Calendar integration from scratch for this project.
      </p>

      <div className="space-y-6 mb-8">
        <Step number={1} title="Created a Google Cloud Project">
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-2">
            I went to <strong>Google Cloud Console</strong> and created a new project named <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">staycationhavencalendar</code>. This project serves as the container for all Google API credentials used in this system.
          </p>
        </Step>

        <Step number={2} title="Enabled the Google Calendar API">
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-2">
            Inside the project, I went to <strong>APIs & Services → Library</strong> and searched for <strong>Google Calendar API</strong>. I enabled it so the project has permission to interact with Google Calendar programmatically.
          </p>
        </Step>

        <Step number={3} title="Created a Service Account">
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-2">
            I created a service account under <strong>IAM & Admin → Service Accounts</strong>. This service account acts as the identity the system uses when creating calendar events — no human needs to be logged in.
          </p>
          <CodeBlock title="Service account created">
            <p className="text-sm text-green-400">staycationhavenphcalendar@staycationhavencalendar.iam.gserviceaccount.com</p>
          </CodeBlock>
        </Step>

        <Step number={4} title="Downloaded the JSON Key">
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-2">
            I generated a JSON key for the service account by going to its <strong>Keys</strong> tab → <strong>Add Key → Create new key → JSON</strong>. The downloaded file contains the <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">client_email</code> and <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">private_key</code> used to authenticate API calls.
          </p>
          <InfoCard variant="warning" icon={AlertTriangle} title="This file is sensitive">
            The JSON key file was never committed to GitHub. The values were extracted and placed directly into the <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded text-xs">.env</code> file.
          </InfoCard>
        </Step>

        <Step number={5} title="Shared the Google Calendar with the Service Account">
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-2">
            I opened <strong>staycationhaven9@gmail.com</strong> in Google Calendar and shared it with the service account email, giving it <strong>"Make changes to events"</strong> permission. This is what allows the service account to create booking events that are visible in that calendar.
          </p>
          <InfoCard variant="info" icon={Info}>
            Without this sharing step, events would be created in the service account's own hidden calendar — invisible to anyone.
          </InfoCard>
        </Step>

        <Step number={6} title="Set up Environment Variables">
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-3">
            I added the credentials from the JSON file into the project's <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">.env</code> file and also into <strong>Vercel Environment Variables</strong> for deployment:
          </p>
          <CodeBlock title=".env">
            <div className="space-y-1 text-sm">
              <p><span className="text-yellow-400">GOOGLE_CLIENT_EMAIL_CALENDAR</span>=<span className="text-green-400">staycationhavenphcalendar@staycationhavencalendar.iam.gserviceaccount.com</span></p>
              <p><span className="text-yellow-400">GOOGLE_PRIVATE_KEY_CALENDAR</span>=<span className="text-green-400">"-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"</span></p>
              <p><span className="text-yellow-400">GOOGLE_PROJECT_ID</span>=<span className="text-green-400">staycationhavencalendar</span></p>
              <p><span className="text-yellow-400">GOOGLE_CALENDAR_ID</span>=<span className="text-green-400">staycationhaven9@gmail.com</span></p>
            </div>
          </CodeBlock>
          <div className="mt-3">
            <InfoCard variant="warning" icon={AlertTriangle} title="Private Key format issue I encountered">
              The private key must be stored as a <strong>single line</strong> using <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded text-xs">\n</code> for line breaks — not actual line breaks. Copying it with real newlines caused a <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded text-xs">DECODER routines::unsupported</code> error that I had to debug and fix.
            </InfoCard>
          </div>
        </Step>

        <Step number={7} title="Built the googleCalendar.ts utility">
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-2">
            I created the file <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">backend/utils/googleCalendar.ts</code> which handles all calendar logic. It uses the <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">googleapis</code> npm package to authenticate via the service account and create events with the booking details as the event description.
          </p>
        </Step>

        <Step number={8} title="Integrated into the Booking Controller">
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-2">
            Inside <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">backend/controller/bookingController.ts</code>, I call <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">createCalendarEvent()</code> right after the payment proof is uploaded. The returned <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">google_event_id</code> is then saved alongside the booking in the database. The event is created even when the booking status is <strong>Pending</strong>.
          </p>
        </Step>
      </div>

      {/* Troubleshooting */}
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-10 mb-4">Troubleshooting</h2>

      <div className="space-y-4 mb-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 md:p-5">
          <div className="flex items-start gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-base font-semibold text-red-900 dark:text-red-100">google_event_id is NULL after booking</h3>
          </div>
          <p className="text-sm text-red-800 dark:text-red-200 mb-2">The calendar event was not created. Possible causes:</p>
          <ul className="list-disc list-inside text-sm text-red-800 dark:text-red-200 space-y-1">
            <li>Environment variables are missing or incorrect</li>
            <li>Private key format is wrong (must be single line with <code className="bg-red-100 dark:bg-red-900/50 px-1 rounded">\n</code>)</li>
            <li>Service account does not have permission to write to the calendar</li>
            <li>Vercel environment variables not updated after change</li>
          </ul>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 md:p-5">
          <div className="flex items-start gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-base font-semibold text-red-900 dark:text-red-100">Event ID is saved but event is not visible in calendar</h3>
          </div>
          <p className="text-sm text-red-800 dark:text-red-200 mb-2">The event was created in the wrong calendar. Fix:</p>
          <ul className="list-disc list-inside text-sm text-red-800 dark:text-red-200 space-y-1">
            <li>Set <code className="bg-red-100 dark:bg-red-900/50 px-1 rounded">GOOGLE_CALENDAR_ID</code> to your actual Gmail address</li>
            <li>Share your calendar with the service account email</li>
            <li>Give the service account "Make changes to events" permission</li>
          </ul>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 md:p-5">
          <div className="flex items-start gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-base font-semibold text-red-900 dark:text-red-100">Error: "DECODER routines::unsupported"</h3>
          </div>
          <p className="text-sm text-red-800 dark:text-red-200 mb-2">The private key format is invalid. Fix:</p>
          <ul className="list-disc list-inside text-sm text-red-800 dark:text-red-200 space-y-1">
            <li>Copy the <code className="bg-red-100 dark:bg-red-900/50 px-1 rounded">private_key</code> value directly from the downloaded JSON file</li>
            <li>Make sure it is all on one line</li>
            <li>Make sure it uses <code className="bg-red-100 dark:bg-red-900/50 px-1 rounded">\n</code> (not actual newlines) between key lines</li>
            <li>Generate a new key from Google Cloud Console if the issue persists</li>
          </ul>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 md:p-5">
          <div className="flex items-start gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-base font-semibold text-yellow-900 dark:text-yellow-100">Payment Proof shows "Pending" in calendar</h3>
          </div>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            This means the guest did not upload a payment proof during checkout. The calendar event will still be created, but the payment proof field will show "Pending" until a payment proof is uploaded.
          </p>
        </div>
      </div>

      {/* Environment Variables Reference */}
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-10 mb-4">Environment Variables Reference</h2>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="text-left p-3 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-semibold">Variable</th>
              <th className="text-left p-3 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-semibold">Description</th>
              <th className="text-left p-3 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-semibold">Example</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="p-3 border border-gray-200 dark:border-gray-600 font-mono text-xs text-gray-800 dark:text-gray-200">GOOGLE_CLIENT_EMAIL_CALENDAR</td>
              <td className="p-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">Service account email address</td>
              <td className="p-3 border border-gray-200 dark:border-gray-600 font-mono text-xs text-gray-600 dark:text-gray-400">service@project.iam.gserviceaccount.com</td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="p-3 border border-gray-200 dark:border-gray-600 font-mono text-xs text-gray-800 dark:text-gray-200">GOOGLE_PRIVATE_KEY_CALENDAR</td>
              <td className="p-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">Private key from service account JSON (single line with \n)</td>
              <td className="p-3 border border-gray-200 dark:border-gray-600 font-mono text-xs text-gray-600 dark:text-gray-400">"-----BEGIN PRIVATE KEY-----\nMIIEv..."</td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="p-3 border border-gray-200 dark:border-gray-600 font-mono text-xs text-gray-800 dark:text-gray-200">GOOGLE_PROJECT_ID</td>
              <td className="p-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">Google Cloud project ID</td>
              <td className="p-3 border border-gray-200 dark:border-gray-600 font-mono text-xs text-gray-600 dark:text-gray-400">staycationhavencalendar</td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="p-3 border border-gray-200 dark:border-gray-600 font-mono text-xs text-gray-800 dark:text-gray-200">GOOGLE_CALENDAR_ID</td>
              <td className="p-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">Target calendar — use your Gmail address for your own calendar</td>
              <td className="p-3 border border-gray-200 dark:border-gray-600 font-mono text-xs text-gray-600 dark:text-gray-400">youremail@gmail.com</td>
            </tr>
          </tbody>
        </table>
      </div>

      <InfoCard variant="success" icon={CheckCircle2} title="Quick Summary">
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Events are created automatically when a booking is submitted</li>
          <li>Events are created even when the booking status is <strong>Pending</strong></li>
          <li>Payment proof link is included in the event description</li>
          <li>The <code className="bg-green-100 dark:bg-green-900/30 px-1 rounded text-xs">google_event_id</code> column in the database stores the event ID</li>
          <li>To change calendars: update <code className="bg-green-100 dark:bg-green-900/30 px-1 rounded text-xs">GOOGLE_CALENDAR_ID</code> and share the new calendar with the service account</li>
        </ul>
      </InfoCard>
    </div>
  );
}
