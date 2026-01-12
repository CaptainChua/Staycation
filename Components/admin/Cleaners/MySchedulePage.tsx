"use client";

import { Calendar, Clock, ChevronLeft, ChevronRight, MapPin, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function MySchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const scheduleData = [
    {
      date: new Date().toDateString(),
      assignments: [
        { haven: "Haven 3", time: "9:00 AM - 11:00 AM", location: "Building A, Floor 2", status: "Completed", statusColor: "text-green-600" },
        { haven: "Haven 7", time: "1:00 PM - 3:00 PM", location: "Building B, Floor 1", status: "In Progress", statusColor: "text-yellow-600" },
        { haven: "Haven 12", time: "4:00 PM - 6:00 PM", location: "Building A, Floor 3", status: "Pending", statusColor: "text-orange-600" },
      ],
    },
    {
      date: new Date(new Date().setDate(new Date().getDate() + 1)).toDateString(),
      assignments: [
        { haven: "Haven 5", time: "10:00 AM - 12:00 PM", location: "Building C, Floor 1", status: "Scheduled", statusColor: "text-blue-600" },
        { haven: "Haven 9", time: "2:00 PM - 4:00 PM", location: "Building B, Floor 2", status: "Scheduled", statusColor: "text-blue-600" },
      ],
    },
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const hasAssignments = (day: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return scheduleData.some((item) => item.date === checkDate.toDateString());
  };

  const getSelectedDateAssignments = () => {
    const selectedDateStr = selectedDate.toDateString();
    return scheduleData.find((item) => item.date === selectedDateStr)?.assignments || [];
  };

  const stats = [
    { label: "Today's Tasks", value: "3", color: "bg-brand-primary" },
    { label: "This Week", value: "8", color: "bg-blue-500" },
    { label: "This Month", value: "24", color: "bg-green-500" },
    { label: "Completed", value: "18", color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Schedule</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View your cleaning assignments calendar
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`${stat.color} text-white rounded-lg p-4 shadow dark:shadow-gray-900`}
          >
            <p className="text-sm opacity-90">{stat.label}</p>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-bold text-gray-600 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}

            {[...Array(startingDayOfWeek)].map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}

            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const hasTask = hasAssignments(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square p-2 rounded-lg text-sm font-semibold transition-all relative ${
                    isSelected
                      ? "bg-brand-primary text-white"
                      : isToday
                      ? "bg-brand-primary/20 text-brand-primaryDark dark:text-brand-primary"
                      : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
                >
                  {day}
                  {hasTask && (
                    <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                      isSelected ? "bg-white" : "bg-brand-primary"
                    }`}></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </h2>
          </div>

          {getSelectedDateAssignments().length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400 text-sm">No assignments scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getSelectedDateAssignments().map((assignment, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                      {assignment.haven}
                    </h3>
                    <span className={`text-xs font-bold ${assignment.statusColor}`}>
                      {assignment.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{assignment.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span>{assignment.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
