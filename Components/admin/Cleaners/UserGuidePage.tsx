"use client";

import {
  BookOpen,
  CheckCircle,
  ClipboardList,
  MapPin,
  AlertCircle,
  Calendar,
  HelpCircle,
  Play,
  FileText,
} from "lucide-react";
import { useState } from "react";

export default function UserGuidePage() {
  const [expandedSection, setExpandedSection] = useState<string | null>("getting-started");

  const guides = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Play,
      color: "bg-blue-500",
      sections: [
        {
          title: "Welcome to Cleaners Portal",
          content:
            "This guide will help you navigate through your daily tasks, manage assignments, and report issues efficiently.",
        },
        {
          title: "Dashboard Overview",
          content:
            "Your dashboard shows today's tasks, completed assignments, and pending work. Check it regularly to stay updated.",
        },
        {
          title: "Logging In",
          content:
            "Use your employee credentials to log in. Contact your supervisor if you forgot your password.",
        },
      ],
    },
    {
      id: "my-assignments",
      title: "Managing Assignments",
      icon: ClipboardList,
      color: "bg-green-500",
      sections: [
        {
          title: "Viewing Assignments",
          content:
            "Go to 'My Assignment' to see all assigned cleaning tasks. Each task shows the haven location, deadline, and priority level.",
        },
        {
          title: "Starting a Task",
          content:
            "Click 'Start Task' on any assignment to begin. This will update the status to 'In Progress' and track your work time.",
        },
        {
          title: "Completing a Task",
          content:
            "Once finished, mark the task as complete. Make sure all checklist items are done before submitting.",
        },
      ],
    },
    {
      id: "cleaning-checklist",
      title: "Using the Cleaning Checklist",
      icon: CheckCircle,
      color: "bg-purple-500",
      sections: [
        {
          title: "Checklist Overview",
          content:
            "The cleaning checklist ensures all areas are properly cleaned. It's organized by room type (Bedroom, Bathroom, Kitchen, etc.).",
        },
        {
          title: "Checking Off Items",
          content:
            "Tap each item as you complete it. The progress bar will update automatically to show your completion percentage.",
        },
        {
          title: "Required vs Optional",
          content:
            "Items marked with a star (*) are required. All required items must be completed before finishing the task.",
        },
      ],
    },
    {
      id: "property-locations",
      title: "Finding Property Locations",
      icon: MapPin,
      color: "bg-orange-500",
      sections: [
        {
          title: "Property Map",
          content:
            "Use 'Property Location' to view a map of all havens. Click on any property to see its exact location and status.",
        },
        {
          title: "Getting Directions",
          content:
            "Click 'Get Directions' on any property card to open navigation in your preferred map app.",
        },
        {
          title: "Property Status",
          content:
            "Each property shows its current status: Available (clean), In Progress (being cleaned), or Needs Cleaning (waiting for you).",
        },
      ],
    },
    {
      id: "reporting-issues",
      title: "Reporting Issues",
      icon: AlertCircle,
      color: "bg-red-500",
      sections: [
        {
          title: "When to Report",
          content:
            "Report any damage, missing items, maintenance needs, or safety concerns immediately using the 'Report an Issue' page.",
        },
        {
          title: "Issue Types",
          content:
            "Select the appropriate category: Maintenance, Damage, Missing Items, Plumbing, Electrical, or Other. Choose the priority level based on urgency.",
        },
        {
          title: "Adding Photos",
          content:
            "Always include photos of the issue. This helps maintenance teams understand and fix problems faster.",
        },
        {
          title: "Tracking Reports",
          content:
            "View all your submitted reports in the 'Recent Reports' section. You'll see status updates as they're processed.",
        },
      ],
    },
    {
      id: "schedule",
      title: "Managing Your Schedule",
      icon: Calendar,
      color: "bg-indigo-500",
      sections: [
        {
          title: "Calendar View",
          content:
            "Your schedule shows all assigned tasks by date. Days with assignments are highlighted in the calendar.",
        },
        {
          title: "Daily Tasks",
          content:
            "Click any date to see all tasks scheduled for that day. Each task shows time, location, and estimated duration.",
        },
        {
          title: "Planning Ahead",
          content:
            "Review your schedule at the start of each week to plan your route and organize supplies needed.",
        },
      ],
    },
    {
      id: "best-practices",
      title: "Best Practices",
      icon: FileText,
      color: "bg-teal-500",
      sections: [
        {
          title: "Time Management",
          content:
            "Start tasks promptly at scheduled times. Notify your supervisor if you'll be late or need extra time.",
        },
        {
          title: "Quality Standards",
          content:
            "Follow the cleaning checklist completely. Pay special attention to high-touch areas and guest-visible spaces.",
        },
        {
          title: "Supply Management",
          content:
            "Check your supply cart before starting. Report low inventory to your supervisor to avoid running out.",
        },
        {
          title: "Communication",
          content:
            "Keep notifications enabled to receive urgent assignments. Check your messages daily for updates from supervisors.",
        },
        {
          title: "Safety First",
          content:
            "Always wear proper PPE. Follow safety protocols when using cleaning chemicals. Report any safety hazards immediately.",
        },
      ],
    },
    {
      id: "faq",
      title: "Frequently Asked Questions",
      icon: HelpCircle,
      color: "bg-yellow-500",
      sections: [
        {
          title: "What if I can't complete a task on time?",
          content:
            "Contact your supervisor immediately. Use the 'Report an Issue' feature to document any delays and reasons.",
        },
        {
          title: "How do I request time off?",
          content:
            "Submit time-off requests through your supervisor. Plan ahead and provide at least 2 weeks notice when possible.",
        },
        {
          title: "What if I find guest belongings?",
          content:
            "Report found items immediately using 'Report an Issue' > 'Other'. Take a photo and hand items to your supervisor.",
        },
        {
          title: "How is my performance tracked?",
          content:
            "Your profile shows completion rate, average rating, and on-time percentage. Maintain quality work for better ratings.",
        },
        {
          title: "Who do I contact for technical issues?",
          content:
            "For app issues, contact IT support. For cleaning-related questions, contact your supervisor directly.",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">User Guide</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Everything you need to know about using the Cleaners Portal
        </p>
      </div>

      {/* Quick Tips Card */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <BookOpen className="w-8 h-8 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-bold mb-2">Quick Tips</h2>
            <ul className="space-y-2 text-sm opacity-90">
              <li>• Check your dashboard every morning for new assignments</li>
              <li>• Complete all checklist items before marking tasks as done</li>
              <li>• Report issues immediately - don't wait until end of day</li>
              <li>• Keep notifications enabled for urgent updates</li>
              <li>• Review your schedule weekly to plan your work</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Guide Sections */}
      <div className="space-y-4">
        {guides.map((guide) => {
          const Icon = guide.icon;
          const isExpanded = expandedSection === guide.id;

          return (
            <div
              key={guide.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden"
            >
              <button
                onClick={() => setExpandedSection(isExpanded ? null : guide.id)}
                className="w-full flex items-center gap-4 p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className={`${guide.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {guide.sections.length} topics
                  </p>
                </div>
                <div
                  className={`transform transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4 animate-in slide-in-from-top-2 duration-200">
                  {guide.sections.map((section, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                        {section.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Support Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          Need More Help?
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          If you can't find the answer you're looking for, contact your supervisor or IT support.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white rounded-lg hover:shadow-lg transition-all font-semibold">
            Contact Supervisor
          </button>
          <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold">
            IT Support
          </button>
        </div>
      </div>
    </div>
  );
}
