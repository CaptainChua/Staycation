"use client";

import { AlertTriangle, Wrench, PackageMinus, Droplets, Zap, FileText, Camera, Send } from "lucide-react";
import { useState } from "react";

export default function ReportIssuePage() {
  const [formData, setFormData] = useState({
    haven: "Haven 3",
    issueType: "",
    priority: "Medium",
    description: "",
    location: "",
  });

  const issueTypes = [
    { label: "Maintenance Needed", icon: Wrench, value: "maintenance" },
    { label: "Damage Found", icon: AlertTriangle, value: "damage" },
    { label: "Missing Items", icon: PackageMinus, value: "missing" },
    { label: "Plumbing Issue", icon: Droplets, value: "plumbing" },
    { label: "Electrical Issue", icon: Zap, value: "electrical" },
    { label: "Other", icon: FileText, value: "other" },
  ];

  const recentReports = [
    {
      id: 1,
      haven: "Haven 7",
      issue: "Broken AC unit",
      status: "Under Review",
      date: "2 hours ago",
      statusColor: "text-yellow-600",
    },
    {
      id: 2,
      haven: "Haven 12",
      issue: "Missing towels",
      status: "Resolved",
      date: "Yesterday",
      statusColor: "text-green-600",
    },
    {
      id: 3,
      haven: "Haven 3",
      issue: "Leaking faucet",
      status: "In Progress",
      date: "2 days ago",
      statusColor: "text-blue-600",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Issue reported:", formData);
    // Handle form submission
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Report Issue</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Report any issues found during cleaning
        </p>
      </div>

      {/* Report Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6">
          New Issue Report
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Haven Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Haven/Unit
            </label>
            <select
              value={formData.haven}
              onChange={(e) => setFormData({ ...formData, haven: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option>Haven 3</option>
              <option>Haven 7</option>
              <option>Haven 12</option>
              <option>Haven 15</option>
            </select>
          </div>

          {/* Issue Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Issue Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {issueTypes.map((type) => {
                const TypeIcon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, issueType: type.value })}
                    className={`flex items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      formData.issueType === type.value
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-primary"
                    }`}
                  >
                    <TypeIcon className="w-5 h-5" />
                    <span className="text-sm font-semibold">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Level */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Priority Level
            </label>
            <div className="flex gap-3">
              {["Low", "Medium", "High", "Urgent"].map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority })}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                    formData.priority === priority
                      ? "bg-brand-primary text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Specific Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Bathroom, Kitchen sink, Living room"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Issue Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              placeholder="Describe the issue in detail..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
            ></textarea>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Upload Photos (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-brand-primary transition-colors cursor-pointer">
              <Camera className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                PNG, JPG up to 10MB
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-primaryDark text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Send className="w-5 h-5" />
            Submit Issue Report
          </button>
        </form>
      </div>

      {/* Recent Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          Recent Reports
        </h2>
        <div className="space-y-3">
          {recentReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{report.haven}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{report.issue}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold ${report.statusColor}`}>
                  {report.status}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{report.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
