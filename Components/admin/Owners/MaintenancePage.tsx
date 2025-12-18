'use client';

import { Wrench, AlertCircle, CheckCircle, Clock, Calendar } from "lucide-react";
import { useState } from "react";

const MaintenancePage = () => {
  const [filter, setFilter] = useState("all");

  const maintenanceRequests = [
    {
      id: "MNT-001",
      haven: "Haven A - City View",
      issue: "Air conditioning not cooling properly",
      priority: "high",
      status: "pending",
      reportedBy: "Juan Dela Cruz",
      reportedDate: "2024-12-17",
      assignedTo: "Maintenance Team A"
    },
    {
      id: "MNT-002",
      haven: "Haven B - Ocean View",
      issue: "Leaking faucet in bathroom",
      priority: "medium",
      status: "in-progress",
      reportedBy: "Maria Santos",
      reportedDate: "2024-12-16",
      assignedTo: "Maintenance Team B"
    },
    {
      id: "MNT-003",
      haven: "Haven C - Pool View",
      issue: "Broken TV remote",
      priority: "low",
      status: "completed",
      reportedBy: "Pedro Reyes",
      reportedDate: "2024-12-15",
      assignedTo: "Maintenance Team A",
      completedDate: "2024-12-16"
    },
    {
      id: "MNT-004",
      haven: "Haven D - Garden View",
      issue: "WiFi not working",
      priority: "high",
      status: "in-progress",
      reportedBy: "Ana Garcia",
      reportedDate: "2024-12-17",
      assignedTo: "IT Team"
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-yellow-100 text-yellow-700";
      case "low": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-5 h-5 text-yellow-500" />;
      case "in-progress": return <Wrench className="w-5 h-5 text-blue-500" />;
      case "completed": return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const filtered = filter === "all" ? maintenanceRequests : maintenanceRequests.filter(r => r.status === filter);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Maintenance</h1>
          <p className="text-gray-600">Track and manage maintenance requests</p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
          + New Request
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          {["all", "pending", "in-progress", "completed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                filter === status ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Requests */}
      <div className="space-y-4">
        {filtered.map((request) => (
          <div key={request.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                {getStatusIcon(request.status)}
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{request.issue}</h3>
                  <p className="text-sm text-gray-600">{request.haven}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(request.priority)}`}>
                {request.priority.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Request ID</p>
                <p className="font-semibold text-gray-800">{request.id}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Reported By</p>
                <p className="font-semibold text-gray-800">{request.reportedBy}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Assigned To</p>
                <p className="font-semibold text-gray-800">{request.assignedTo}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Date</p>
                <p className="font-semibold text-gray-800">{new Date(request.reportedDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {request.status === "pending" && (
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Assign Team
                </button>
              )}
              {request.status === "in-progress" && (
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  Mark Complete
                </button>
              )}
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaintenancePage;
