"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Search, UserPlus, CheckCircle, AlertCircle, MapPin, Calendar, User, FileText } from "lucide-react";
import { useGetEmployeesQuery } from "@/redux/api/employeeApi";
import { useGetReportsQuery } from "@/redux/api/reportApi";
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  employment_id: string;
  role: 'Owner' | 'CSR' | 'Cleaner' | 'Partner' | 'Maintenance';
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
}

interface AssignToModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (employeeId: string, assignedTo: string) => void;
  reportId: string;
  isLoading?: boolean;
}

export default function AssignToModal({ isOpen, onClose, onAssign, reportId, isLoading }: AssignToModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch employees filtered for maintenance role and department
  const { data: employeesData, isLoading: employeesLoading } = useGetEmployeesQuery({});
  
  // Fetch specific report details
  const { data: reportsData } = useGetReportsQuery({});
  
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

  // Filter employees for maintenance assignments only
  const maintenanceEmployees = employeesData?.data?.filter(
    (emp: Employee) => emp.role === 'Cleaner' && emp.department === 'Maintenance'
  ) || [];

  const filteredEmployees = maintenanceEmployees.filter((emp: Employee) =>
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employment_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "High": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Urgent": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleAssign = () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee to assign");
      return;
    }
    const assignedTo = `${selectedEmployee.first_name} ${selectedEmployee.last_name}`;
    onAssign(selectedEmployee.id, assignedTo);
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
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Assign Maintenance Request
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Assign a maintenance employee to handle this issue
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
          {/* Issue Information */}
          {transformedReport && (
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
          )}

          {/* Employee Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Employee
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, email, or employment ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Employee ({maintenanceEmployees.length} available)
              </label>
              <div className="relative">
                <select
                  value={selectedEmployee?.id || ""}
                  onChange={(e) => {
                    const employee = filteredEmployees.find((emp: Employee) => emp.id === e.target.value);
                    setSelectedEmployee(employee || null);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500"
                >
                  <option value="">Select an employee...</option>
                  {filteredEmployees.map((emp: Employee) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} - {emp.role}
                      {emp.department && ` (${emp.department})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Employee Preview */}
            {selectedEmployee && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedEmployee.email} • {selectedEmployee.employment_id}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedEmployee || employeesLoading || isLoading}
            className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {employeesLoading || isLoading ? (
              <>
                <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isLoading ? 'Assigning...' : 'Loading...'}
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Assign Employee
              </>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
