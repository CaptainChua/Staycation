"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, MapPin, AlertCircle, FileText, Camera, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetReportsQuery } from "@/redux/api/reportApi";
import Image from "next/image";

interface Report {
  report_id: string;
  haven_name: string;
  issue_description: string;
  specific_location: string;
  issue_type: string;
  priority_level: string;
  created_at: string;
  status?: string;
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
}

export default function ViewReportDetails({ isOpen, onClose, reportId }: ViewReportDetailsProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Fetch specific report details
  const { data: reportsData, isLoading } = useGetReportsQuery({});
  
  const selectedReport = useMemo(() => {
    if (!reportsData?.data) return null;
    return reportsData.data.find((report: Report) => report.report_id === reportId);
  }, [reportsData, reportId]);

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

  const getIssueTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "maintenance": return "🔧";
      case "damage": return "⚠️";
      case "missing": return "📦";
      case "plumbing": return "💧";
      case "electrical": return "⚡";
      default: return "📄";
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
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSelectedImageIndex(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9980] bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div
        ref={modalRef}
        className="fixed z-[9991] w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Report Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View complete information about this report
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
          ) : !selectedReport ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Report not found</p>
            </div>
          ) : (
            <>
              {/* Issue Information */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <FileText className="w-4 h-4" />
                  Issue Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Report ID:</span>
                      <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                        {selectedReport.report_id.slice(0, 12)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Haven:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedReport.haven_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Location:</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedReport.specific_location}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Type:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1">
                        <span>{getIssueTypeIcon(selectedReport.issue_type)}</span>
                        <span className="capitalize">{selectedReport.issue_type}</span>
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Priority:</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedReport.priority_level)}`}>
                        {selectedReport.priority_level}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedReport.status)}`}>
                        {selectedReport.status || 'Open'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Date:</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(selectedReport.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Time:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {new Date(selectedReport.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Description:</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                        {selectedReport.issue_description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images Section */}
              {selectedReport.images && selectedReport.images.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Camera className="w-4 h-4" />
                    Attached Images ({selectedReport.images.length})
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {selectedReport.images.map((img: { image_url: string; cloudinary_public_id?: string }, index: number) => (
                      <div 
                        key={index} 
                        className="relative group cursor-pointer aspect-square overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-brand-primary transition-all"
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <Image
                          src={img.image_url}
                          alt={`Issue image ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-2">
                              <Camera className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Viewer Modal */}
              {selectedImageIndex !== null && selectedReport.images && (
                <div 
                  className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
                  onClick={() => setSelectedImageIndex(null)}
                >
                  <button
                    onClick={() => setSelectedImageIndex(null)}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    type="button"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                  
                  {selectedImageIndex > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(selectedImageIndex - 1);
                      }}
                      className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                      type="button"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                  )}
                  
                  {selectedImageIndex < selectedReport.images.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(selectedImageIndex + 1);
                      }}
                      className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                      type="button"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                  )}
                  
                  <div 
                    className="max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Image
                      src={selectedReport.images[selectedImageIndex].image_url}
                      alt={`Issue image ${selectedImageIndex + 1}`}
                      width={1200}
                      height={800}
                      className="max-w-full max-h-full object-contain rounded-lg"
                      priority
                    />
                  </div>
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                    Image {selectedImageIndex + 1} of {selectedReport.images.length}
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
            className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark font-medium text-sm transition-colors"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
