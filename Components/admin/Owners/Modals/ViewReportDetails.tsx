"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, User, MapPin, AlertCircle, FileText, Camera, Clock, CheckCircle, UserPlus, Loader2 } from "lucide-react";
import { useGetReportsQuery } from "@/redux/api/reportApi";
import { useGetEmployeesQuery } from "@/redux/api/employeeApi";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  employment_id: string;
  role: string;
  department?: string;
  profile_image_url?: string;
}

interface Report {
  report_id: string;
  haven_name: string;
  issue_description: string;
  specific_location: string;
  issue_type: string;
  priority_level: string;
  reported_by: string;
  created_at: string;
  status?: string;
  assigned_to?: string;
  images?: Array<{
    image_url: string;
    cloudinary_public_id?: string;
  }>;
  user_id: string;
}

interface ViewReportDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  onAssign?: (reportId: string) => void;
}

export default function ViewReportDetails({ isOpen, onClose, reportId, onAssign }: ViewReportDetailsProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch specific report details
  const { data: reportsData } = useGetReportsQuery({});
  
  // Fetch employees for name lookup
  const { data: employeesData } = useGetEmployeesQuery({});
  
  // Create user lookup map from all employees data
  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (employeesData?.success && employeesData?.data) {
      employeesData.data.forEach((employee: Employee) => {
        if (employee.id && employee.first_name && employee.last_name) {
          map[employee.id] = `${employee.first_name} ${employee.last_name}`;
        }
      });
    }
    return map;
  }, [employeesData]);
  
  const selectedReport = reportsData?.data?.find((report: Report) => report.report_id === reportId);
  
  // Transform report data to include proper reported_by name
  const transformedReport = useMemo(() => {
    if (!selectedReport) return null;
    
    return {
      ...selectedReport,
      reported_by: userMap[selectedReport.user_id] || 'Unknown User'
    };
  }, [selectedReport, userMap]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Open":
        return "text-yellow-600 dark:text-yellow-400";
      case "In Progress":
        return "text-blue-600 dark:text-blue-400";
      case "Resolved":
        return "text-green-600 dark:text-green-400";
      case "Closed":
        return "text-gray-600 dark:text-gray-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "High": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Urgent": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (modalRef.current && !modalRef.current.contains(target)) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9980] bg-black/50" aria-hidden="true" />
      <div
        ref={modalRef}
        className="fixed z-[9991] w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Maintenance Request Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View complete information about this maintenance request
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {transformedReport && (
            <>
              {/* Issue Information */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <FileText className="w-4 h-4" />
                  Issue Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Issue ID:</span>
                      <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                        {transformedReport.report_id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Haven:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {transformedReport.haven_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Location:</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {transformedReport.specific_location}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Type:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {transformedReport.issue_type}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Priority:</span>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(transformedReport.priority_level)}`}>
                        {transformedReport.priority_level}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</span>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(transformedReport.status)}`}>
                        {transformedReport.status || 'Open'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Reported by:</span>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {transformedReport.reported_by}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Date:</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(transformedReport.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Description:</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {transformedReport.issue_description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned To */}
              {transformedReport.assigned_to && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Assigned to:</span>
                    <div className="flex items-center gap-1">
                      <UserPlus className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {transformedReport.assigned_to}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Images */}
              {transformedReport.images && transformedReport.images.length > 0 && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <Camera className="w-4 h-4" />
                    Attached Images ({transformedReport.images.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {transformedReport.images.map((img: { image_url: string; cloudinary_public_id?: string }, index: number) => (
                      <div key={index} className="relative group cursor-pointer">
                        <img
                          src={img.image_url}
                          alt={`Issue image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          onClick={() => window.open(img.image_url, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-white rounded-lg p-1">
                              <Camera className="w-4 h-4 text-gray-700" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
          >
            Close
          </button>
          {onAssign && (
            <button
              onClick={() => onAssign(reportId)}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark font-medium flex items-center gap-2 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Assign to Employee
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}