'use client';

/* eslint-disable react/no-unescaped-entities */

import React from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  Share2,
  Globe,
  Mail,
  Shield,
  Settings,
  Eye,
} from 'lucide-react';
import { InfoCard, CodeBlock, Step } from './DocComponents';

export default function GoogleCalendarIntegrateContent() {
  return (
    <div className="w-full">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
        Integrate with Other Google Calendar
      </h1>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <p className="text-base md:text-lg text-blue-900 dark:text-blue-100">
            <strong>Good news:</strong> You do NOT need a new service account or new credentials. The existing service account email <strong>staycationhavenphcalendar@staycationhavencalendar.iam.gserviceaccount.com</strong> can be added to any Google Calendar — just like sharing with a regular person.
          </p>
        </div>
      </div>

      {/* Concept Explanation */}
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">How This Works</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Think of the service account as a <strong>robot user</strong>. Just like you can share a Google Calendar with any person's email address, you can share it with a service account email. Once shared, the service account can create booking events directly in that calendar.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 text-sm font-bold">✗</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">What you do NOT need</h3>
          </div>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
            <li>A new service account</li>
            <li>New credentials or JSON key</li>
            <li>Changes to the codebase</li>
            <li>A new Google Cloud project</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">What you only need</h3>
          </div>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
            <li>The other person shares their calendar</li>
            <li>Give "Make changes to events" permission</li>
            <li>Update <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">GOOGLE_CALENDAR_ID</code> in .env</li>
            <li>Redeploy on Vercel</li>
          </ul>
        </div>
      </div>

      {/* Step by Step */}
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-10 mb-6">
        Step-by-Step Guide
      </h2>

      <div className="space-y-6 mb-10">
        <Step number={1} title="The other person opens their Google Calendar">
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-2">
            The owner of the other Google Calendar (e.g., a new admin) must do this on their own Google account.
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>Open <strong>Google Calendar</strong>: <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">calendar.google.com</span></li>
            <li>Make sure they are logged in with their own Google account</li>
          </ol>
        </Step>

        <Step number={2} title="Open Calendar Settings">
          <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>In the left sidebar under <strong>"My calendars"</strong>, find their main calendar (usually their name or email)</li>
            <li>Hover over it and click the <strong>three-dot menu (⋮)</strong> that appears</li>
            <li>Click <strong>"Settings and sharing"</strong></li>
          </ol>
        </Step>

        <Step number={3} title="Share the calendar with the service account">
          <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-3">
            <li>Scroll down to the section <strong>"Share with specific people or groups"</strong></li>
            <li>Click <strong>"+ Add people and groups"</strong></li>
            <li>In the email field, paste this exact email:</li>
          </ol>
          <CodeBlock>
            <p className="text-sm text-green-400 select-all">staycationhavenphcalendar@staycationhavencalendar.iam.gserviceaccount.com</p>
          </CodeBlock>
          <div className="mt-3">
            <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1" start={4}>
              <li>In the <strong>Permissions</strong> dropdown, select <strong>"Make changes to events"</strong></li>
              <li>Click <strong>"Send"</strong></li>
            </ol>
          </div>
          <div className="mt-3">
            <InfoCard variant="warning" icon={AlertTriangle} title="Important: Permission Level">
              Make sure to select <strong>"Make changes to events"</strong> — not just "See all event details". Without the correct permission, the service account can see the calendar but cannot create new booking events.
            </InfoCard>
          </div>
        </Step>

        <Step number={4} title="Get the Calendar ID of the new calendar">
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-2">
            While still in the calendar settings:
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-3">
            <li>Scroll down to the section <strong>"Integrate calendar"</strong></li>
            <li>Copy the <strong>Calendar ID</strong></li>
          </ol>
          <InfoCard variant="info" icon={Info}>
            <p className="text-sm">For a personal Google Calendar, the Calendar ID is usually just the Gmail address (e.g., <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded text-xs">maria@gmail.com</code>). For a secondary or shared calendar, it looks like a long string ending in <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded text-xs">@group.calendar.google.com</code>.</p>
          </InfoCard>
        </Step>

        <Step number={5} title="Update GOOGLE_CALENDAR_ID in .env">
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-3">
            Open your <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">.env</code> file and update the calendar ID:
          </p>
          <CodeBlock title=".env">
            <div className="space-y-1 text-sm">
              <p className="text-gray-500"># Change this line only:</p>
              <p><span className="text-yellow-400">GOOGLE_CALENDAR_ID</span>=<span className="text-green-400 line-through opacity-50">staycationhaven9@gmail.com</span></p>
              <br />
              <p className="text-gray-500"># Replace with the new calendar ID:</p>
              <p><span className="text-yellow-400">GOOGLE_CALENDAR_ID</span>=<span className="text-green-400">newperson@gmail.com</span></p>
            </div>
          </CodeBlock>
          <div className="mt-3">
            <InfoCard variant="success" icon={CheckCircle2} title="Everything else stays the same">
              You do not need to change <code className="bg-green-100 dark:bg-green-900/30 px-1 rounded text-xs">GOOGLE_CLIENT_EMAIL_CALENDAR</code> or <code className="bg-green-100 dark:bg-green-900/30 px-1 rounded text-xs">GOOGLE_PRIVATE_KEY_CALENDAR</code>. Only the calendar ID changes.
            </InfoCard>
          </div>
        </Step>

        <Step number={6} title="Update the variable in Vercel and redeploy">
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-3">
            Since the app is deployed on Vercel, you must also update the variable there:
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-3">
            <li>Go to <strong>vercel.com</strong> → open your project</li>
            <li>Click <strong>Settings</strong> → <strong>Environment Variables</strong></li>
            <li>Find <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">GOOGLE_CALENDAR_ID</code> and click <strong>Edit</strong></li>
            <li>Replace the value with the new calendar ID</li>
            <li>Click <strong>Save</strong></li>
            <li>Go to <strong>Deployments</strong> → click the latest deployment → click <strong>Redeploy</strong></li>
          </ol>
          <InfoCard variant="warning" icon={AlertTriangle} title="Redeploy is required">
            Environment variable changes in Vercel do not take effect until you redeploy the application.
          </InfoCard>
        </Step>

        <Step number={7} title="Verify it is working">
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-3">
            After redeploying, test the integration:
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-3">
            <li>Go to the website and make a test booking</li>
            <li>Open the new person's Google Calendar and check if the booking event appeared</li>
            <li>Check the database — <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">google_event_id</code> should have a value (not NULL)</li>
          </ol>
          <CodeBlock title="Check database">
            <p className="text-sm text-gray-300">SELECT booking_id, google_event_id FROM booking</p>
            <p className="text-sm text-gray-300">ORDER BY created_at DESC LIMIT 3;</p>
          </CodeBlock>
        </Step>
      </div>

      {/* Visual Summary */}
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-10 mb-4">Visual Summary</h2>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8">
        <div className="flex flex-col gap-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primaryLight dark:bg-brand-primaryDark rounded-full flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-brand-primaryDark dark:text-brand-primaryLight" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Guest submits booking on the website</p>
            </div>
          </div>
          <div className="ml-5 border-l-2 border-dashed border-gray-300 dark:border-gray-600 pl-8 py-1 text-xs text-gray-500 dark:text-gray-400">API processes booking</div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primaryLight dark:bg-brand-primaryDark rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-brand-primaryDark dark:text-brand-primaryLight" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Service Account authenticates</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">staycationhavenphcalendar@staycationhavencalendar.iam.gserviceaccount.com</p>
            </div>
          </div>
          <div className="ml-5 border-l-2 border-dashed border-gray-300 dark:border-gray-600 pl-8 py-1 text-xs text-gray-500 dark:text-gray-400">Uses GOOGLE_CALENDAR_ID to know which calendar to write to</div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primaryLight dark:bg-brand-primaryDark rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-brand-primaryDark dark:text-brand-primaryLight" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Event is created in the target calendar</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">The calendar owner sees the booking event automatically</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-10 mb-4">Frequently Asked Questions</h2>

      <div className="space-y-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base">Can the service account write to multiple calendars at the same time?</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            The current setup only writes to one calendar at a time — whichever is set in <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">GOOGLE_CALENDAR_ID</code>. To change which calendar receives bookings, you just update that one variable.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base">Does the other person need a Google Cloud account?</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            No. The other person only needs a regular Google account with Google Calendar. They just need to share their calendar with the service account email — that's it.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base">What happens to old bookings when I switch calendars?</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Old bookings stay in the previous calendar. Only new bookings made after the switch will appear in the new calendar. The <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">google_event_id</code> in the database still points to the events in the old calendar.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base">Can I switch back to the original calendar?</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Yes. Just set <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">GOOGLE_CALENDAR_ID</code> back to <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">staycationhaven9@gmail.com</code> and redeploy.
          </p>
        </div>
      </div>

      <InfoCard variant="success" icon={CheckCircle2} title="Summary">
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>No new credentials needed — the same service account works for any calendar</li>
          <li>The calendar owner just shares with <strong>staycationhavenphcalendar@staycationhavencalendar.iam.gserviceaccount.com</strong></li>
          <li>Set permission to <strong>"Make changes to events"</strong></li>
          <li>Update <code className="bg-green-100 dark:bg-green-900/30 px-1 rounded text-xs">GOOGLE_CALENDAR_ID</code> in .env and Vercel</li>
          <li>Redeploy — done!</li>
        </ul>
      </InfoCard>
    </div>
  );
}
