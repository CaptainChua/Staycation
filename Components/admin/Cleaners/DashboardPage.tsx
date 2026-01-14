"use client";

import { ClipboardList, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      label: "Today's Tasks",
      value: "5",
      color: "bg-blue-500",
      icon: ClipboardList,
    },
    {
      label: "Completed",
      value: "3",
      color: "bg-green-500",
      icon: CheckCircle,
    },
    {
      label: "In Progress",
      value: "1",
      color: "bg-yellow-500",
      icon: Clock,
    },
    {
      label: "Pending",
      value: "1",
      color: "bg-orange-500",
      icon: AlertTriangle,
    },
  ];

  const recentTasks = [
    { haven: "Haven 3", status: "Completed", time: "10:30 AM", statusColor: "text-green-600" },
    { haven: "Haven 7", status: "In Progress", time: "1:00 PM", statusColor: "text-yellow-600" },
    { haven: "Haven 12", status: "Pending", time: "3:00 PM", statusColor: "text-orange-600" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview of your daily cleaning tasks and performance
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

      {/* Recent Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          Today&apos;s Schedule
        </h2>
        <div className="space-y-3">
          {recentTasks.map((task, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                <span className="font-semibold text-gray-800 dark:text-gray-100">{task.haven}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">{task.time}</span>
                <span className={`text-sm font-bold ${task.statusColor}`}>{task.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
