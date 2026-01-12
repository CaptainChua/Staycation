"use client";

import { ClipboardList, MapPin, Clock, AlertCircle, CheckCircle2, Flag } from "lucide-react";

export default function MyAssignmentPage() {
  const assignments = [
    {
      id: 1,
      haven: "Haven 3",
      location: "Building A, Floor 2",
      status: "In Progress",
      deadline: "Today, 2:00 PM",
      priority: "High",
      statusColor: "text-yellow-600",
      priorityColor: "text-red-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      id: 2,
      haven: "Haven 7",
      location: "Building B, Floor 1",
      status: "Pending",
      deadline: "Today, 4:00 PM",
      priority: "Medium",
      statusColor: "text-orange-600",
      priorityColor: "text-yellow-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      id: 3,
      haven: "Haven 12",
      location: "Building A, Floor 3",
      status: "Not Started",
      deadline: "Today, 5:30 PM",
      priority: "Low",
      statusColor: "text-gray-600",
      priorityColor: "text-blue-600",
      bgColor: "bg-gray-50 dark:bg-gray-700",
    },
    {
      id: 4,
      haven: "Haven 15",
      location: "Building C, Floor 2",
      status: "Completed",
      deadline: "Today, 12:00 PM",
      priority: "High",
      statusColor: "text-green-600",
      priorityColor: "text-red-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
  ];

  const stats = [
    {
      label: "Total Assignments",
      value: "4",
      color: "bg-brand-primary",
      icon: ClipboardList,
    },
    {
      label: "Completed",
      value: "1",
      color: "bg-green-500",
      icon: CheckCircle2,
    },
    {
      label: "In Progress",
      value: "1",
      color: "bg-yellow-500",
      icon: Clock,
    },
    {
      label: "Pending",
      value: "2",
      color: "bg-orange-500",
      icon: AlertCircle,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Assignments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View and manage your assigned cleaning tasks
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={i}
              className={`${stat.color} text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <IconComponent className="w-12 h-12 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Assignments List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          Today's Assignments
        </h2>
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className={`${assignment.bgColor} rounded-lg p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-brand-primary"></div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {assignment.haven}
                  </h3>
                </div>
                <span className={`text-sm font-bold ${assignment.statusColor} px-3 py-1 rounded-full bg-white dark:bg-gray-800`}>
                  {assignment.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{assignment.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{assignment.deadline}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  <span className={`text-sm font-semibold ${assignment.priorityColor}`}>
                    {assignment.priority} Priority
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {assignment.status !== "Completed" && (
                  <>
                    <button className="bg-brand-primary hover:bg-brand-primaryDark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                      Start Task
                    </button>
                    <button className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                      View Details
                    </button>
                  </>
                )}
                {assignment.status === "Completed" && (
                  <button className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    View Report
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
