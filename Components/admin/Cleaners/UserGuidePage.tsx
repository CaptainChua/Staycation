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
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function UserGuidePage() {
  const [expandedSection, setExpandedSection] = useState<string | null>("getting-started");

  const guides = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Play,
      accent: "#3B82F6",
      lightBg: "bg-blue-50 dark:bg-blue-950/30",
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
      border: "border-blue-200 dark:border-blue-800",
      iconBg: "bg-blue-500",
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
      accent: "#22C55E",
      lightBg: "bg-green-50 dark:bg-green-950/30",
      badge: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
      border: "border-green-200 dark:border-green-800",
      iconBg: "bg-green-500",
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
      accent: "#A855F7",
      lightBg: "bg-purple-50 dark:bg-purple-950/30",
      badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
      border: "border-purple-200 dark:border-purple-800",
      iconBg: "bg-purple-500",
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
      accent: "#F97316",
      lightBg: "bg-orange-50 dark:bg-orange-950/30",
      badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
      border: "border-orange-200 dark:border-orange-800",
      iconBg: "bg-orange-500",
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
      accent: "#EF4444",
      lightBg: "bg-red-50 dark:bg-red-950/30",
      badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
      border: "border-red-200 dark:border-red-800",
      iconBg: "bg-red-500",
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
      accent: "#6366F1",
      lightBg: "bg-indigo-50 dark:bg-indigo-950/30",
      badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
      border: "border-indigo-200 dark:border-indigo-800",
      iconBg: "bg-indigo-500",
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
      accent: "#14B8A6",
      lightBg: "bg-teal-50 dark:bg-teal-950/30",
      badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
      border: "border-teal-200 dark:border-teal-800",
      iconBg: "bg-teal-500",
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
      accent: "#EAB308",
      lightBg: "bg-yellow-50 dark:bg-yellow-950/30",
      badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
      border: "border-yellow-200 dark:border-yellow-800",
      iconBg: "bg-yellow-500",
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

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-gray-200 dark:border-gray-700 rounded-2xl p-7 bg-white dark:bg-gray-800 shadow-sm">
        <div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">
            User Guide
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 mt-2 font-medium">
            Everything you need to know about using the Cleaners Portal
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-full px-5 py-2">
          <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span className="text-base font-semibold text-amber-700 dark:text-amber-300">
            {guides.length} Sections
          </span>
        </div>
      </div>

      {/* Quick Tips Card */}
      <div className="bg-gradient-to-br from-amber-500 via-yellow-400 to-orange-400 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-white/25 p-3 rounded-xl">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-md">
            Quick Tips
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: "✓", text: "Check your dashboard every morning for new assignments", bg: "bg-white/15" },
            { icon: "✓", text: "Complete all checklist items before marking tasks as done", bg: "bg-white/15" },
            { icon: "⚠", text: "Report issues immediately — don't wait until end of day", bg: "bg-white/20" },
            { icon: "🔔", text: "Keep notifications enabled for urgent updates", bg: "bg-white/15" },
            { icon: "📅", text: "Review your weekly schedule to plan your work", bg: "bg-white/15" },
          ].map((tip, i) => (
            <div
              key={i}
              className={`${tip.bg} backdrop-blur-sm border border-white/25 rounded-xl px-5 py-4 flex items-start gap-4 ${i === 4 ? "md:col-span-2" : ""}`}
            >
              <span className="text-2xl font-black flex-shrink-0 mt-0.5">{tip.icon}</span>
              <p className="text-white text-xl md:text-2xl font-semibold leading-snug">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Guide Sections */}
      <div className="space-y-3">
        {guides.map((guide) => {
          const Icon = guide.icon;
          const isExpanded = expandedSection === guide.id;

          return (
            <div
              key={guide.id}
              className={`rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                isExpanded
                  ? `${guide.border} shadow-lg`
                  : "border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
              } bg-white dark:bg-gray-800`}
            >
              {/* Accordion Header */}
              <button
                onClick={() => setExpandedSection(isExpanded ? null : guide.id)}
                className={`w-full flex items-center gap-5 p-6 transition-colors ${
                  isExpanded
                    ? `${guide.lightBg}`
                    : "hover:bg-gray-50 dark:hover:bg-gray-750"
                }`}
              >
                <div className={`${guide.iconBg} p-3.5 rounded-xl shadow-sm flex-shrink-0`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <div className="flex-1 text-left">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-50">
                    {guide.title}
                  </h3>
                  <p className="text-base text-gray-500 dark:text-gray-400 mt-1 font-medium">
                    {guide.sections.length} topics
                  </p>
                </div>

                <div className={`flex-shrink-0 ${guide.badge} rounded-full px-4 py-1.5 text-base font-bold hidden sm:block mr-2`}>
                  {guide.sections.length} topics
                </div>

                <div
                  className={`flex-shrink-0 transform transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                </div>
              </button>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-4 space-y-3 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
                  {guide.sections.map((section, index) => (
                    <div
                      key={index}
                      className={`p-5 ${guide.lightBg} border ${guide.border} rounded-xl`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex-shrink-0 w-7 h-7 rounded-full ${guide.iconBg} text-white text-sm font-black flex items-center justify-center mt-0.5`}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1.5">
                            {section.title}
                          </h4>
                          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                            {section.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Support Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-7">
        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-3">
          Need More Help?
        </h3>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          If you can't find the answer you're looking for, contact your supervisor or IT support.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/contacts"
            onClick={(e) => e.stopPropagation()}
            className="px-7 py-4 bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white rounded-xl hover:shadow-lg transition-all font-bold text-xl text-center"
          >
            Contact Supervisor
          </Link>
          <Link
            href="/help-center"
            onClick={(e) => e.stopPropagation()}
            className="px-7 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-bold text-xl text-center"
          >
            IT Support
          </Link>
        </div>
      </div>
    </div>
  );
}
