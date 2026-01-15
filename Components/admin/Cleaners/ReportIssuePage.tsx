"use client";

import { AlertTriangle, Wrench, PackageMinus, Droplets, Zap, FileText, Camera, Send, Loader2, CheckCircle, Search, Filter, Plus, Eye, Trash2, ArrowUpDown, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useGetHavensQuery } from "@/redux/api/roomApi";
import { useSubmitReportMutation, useGetReportsQuery, useDeleteReportMutation, ReportIssueRequest } from "@/redux/api/reportApi";
import { Haven } from "@/types/Haven";

export default function ReportIssuePage() {
  const [formData, setFormData] = useState({
    haven: "",
    issueType: "",
    priority: "Medium",
    description: "",
    location: "",
  });

  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);

  // Fetch havens from API
  const { data: havens, isLoading, isError } = useGetHavensQuery({});
  const [submitReport, { isLoading: isSubmittingReport }] = useSubmitReportMutation();
  const { data: reports = [], isLoading: isLoadingReports, error: reportsError } = useGetReportsQuery({});
  const [deleteReport] = useDeleteReportMutation();
  const havenList = Array.isArray(havens) ? havens : [];
  
  // Remove duplicate haven names while preserving all data and ensure proper alignment
  const uniqueHavens: Haven[] = [];
  const seenNames = new Set<string>();
  
  havenList.forEach((haven) => {
    if (haven && typeof (haven as any).haven_name === 'string') {
      let name = (haven as any).haven_name.trim();
      
      // Standardize haven name format (Haven 1, Haven 2, etc.)
      if (name.toLowerCase().includes('haven')) {
        // Extract the number and ensure proper format
        const match = name.match(/haven\s*(\d+)/i);
        if (match) {
          const number = parseInt(match[1]);
          if (number >= 1 && number <= 5) {
            name = `Haven ${number}`;
          }
        }
      }
      
      if (name && !seenNames.has(name)) {
        seenNames.add(name);
        uniqueHavens.push({ ...haven, haven_name: name } as Haven);
      }
    }
  });
  
  // Sort havens by number (Haven 1, Haven 2, etc.)
  uniqueHavens.sort((a, b) => {
    const aMatch = a.haven_name.match(/\d+/);
    const bMatch = b.haven_name.match(/\d+/);
    const aNum = aMatch ? parseInt(aMatch[0]) : 0;
    const bNum = bMatch ? parseInt(bMatch[0]) : 0;
    return aNum - bNum;
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
      haven: uniqueHavens.length > 0 ? uniqueHavens[0]?.haven_name || "Haven 7" : "Haven 7",
      issue: "Broken AC unit",
      status: "Under Review",
      date: "2 hours ago",
      statusColor: "text-yellow-600",
    },
    {
      id: 2,
      haven: uniqueHavens.length > 1 ? uniqueHavens[1]?.haven_name || "Haven 12" : "Haven 12",
      issue: "Missing towels",
      status: "Resolved",
      date: "Yesterday",
      statusColor: "text-green-600",
    },
    {
      id: 3,
      haven: uniqueHavens.length > 2 ? uniqueHavens[2]?.haven_name || "Haven 3" : "Haven 3",
      issue: "Leaking faucet",
      status: "In Progress",
      date: "2 days ago",
      statusColor: "text-blue-600",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validation
    if (!formData.haven) {
      toast.error("Please select a haven/unit");
      setIsSubmitting(false);
      return;
    }
    if (!formData.issueType) {
      toast.error("Please select an issue type");
      setIsSubmitting(false);
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please provide a description of the issue");
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Find the haven ID from the selected haven name
      const selectedHaven = uniqueHavens.find(h => h.haven_name === formData.haven);
      if (!selectedHaven) {
        toast.error("Invalid haven selected");
        setIsSubmitting(false);
        return;
      }

      // Prepare the report data
      const reportData: ReportIssueRequest = {
        haven_id: (selectedHaven.uuid_id || selectedHaven.id || '').toString(),
        issue_type: formData.issueType,
        priority_level: formData.priority,
        specific_location: formData.location || 'Not specified',
        issue_description: formData.description,
        images: uploadedPhotos
      };

      // Submit report
      const result = await submitReport(reportData).unwrap().catch((error) => {
        console.error("RTK Query unwrap error:", error);
        console.error("Full RTK error:", JSON.stringify(error, null, 2));
        
        // Extract error message from RTK Query error
        let errorMessage = "Failed to submit report. Please try again.";
        
        if (error?.data?.message) {
          errorMessage = error.data.message;
        } else if (error?.data?.status) {
          errorMessage = error.data.status;
        } else if (error?.status) {
          errorMessage = `HTTP ${error.status}: ${error.statusText || 'Server Error'}`;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          errorMessage = JSON.stringify(error);
        }
        
        toast.error(errorMessage);
        throw error; // Re-throw to prevent further processing
      });
      
      // If we get here, the submission was successful
      toast.success("Report submitted successfully!");
      setSubmitSuccess(true);
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          haven: "",
          issueType: "",
          priority: "Medium",
          description: "",
          location: "",
        });
        setUploadedPhotos([]);
        setPhotoPreviews([]);
        setSubmitSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error("Error submitting report:", error);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      
      // Handle RTK Query error structure
      let errorMessage = "Failed to submit report. Please try again.";
      
      if (error?.error?.data) {
        // RTK Query with API response
        errorMessage = error.error.data.message || error.error.data.status || JSON.stringify(error.error.data);
      } else if (error?.error) {
        // RTK Query error
        errorMessage = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
      } else if (error?.data) {
        // Direct API response
        errorMessage = error.data.message || error.data.status || JSON.stringify(error.data);
      } else if (error?.message) {
        errorMessage = error.message;
      } else {
        // Last resort - show the full error object
        errorMessage = `Error: ${JSON.stringify(error)}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Filter for valid image files
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) {
      toast.error("Please select valid image files (PNG, JPG) under 10MB");
      return;
    }

    // Create previews for valid files
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    
    setUploadedPhotos(prev => [...prev, ...validFiles]);
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
    
    toast.success(`${validFiles.length} photo(s) added successfully`);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    document.getElementById('photo-upload-input')?.click();
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 sm:p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6">
          New Issue Report
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Haven Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Haven/Unit
            </label>
            {isLoading ? (
              <div className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Loading havens...</span>
              </div>
            ) : isError ? (
              <div className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-red-300 dark:border-red-600 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                Failed to load havens. Please refresh the page.
              </div>
            ) : (
              <select
                value={formData.haven}
                onChange={(e) => setFormData({ ...formData, haven: e.target.value })}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all text-sm sm:text-base"
              >
                <option value="">Select a haven...</option>
                {uniqueHavens.map((haven: Haven, index: number) => (
                  <option 
                    key={haven.id || `${haven.haven_name || 'unknown'}-${index}`} 
                    value={haven.haven_name || ''}
                  >
                    {haven.haven_name || 'Unnamed Haven'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Issue Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
              Issue Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {issueTypes.map((type) => {
                const TypeIcon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, issueType: type.value })}
                    className={`flex items-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all ${
                      formData.issueType === type.value
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-brand-primary hover:text-white hover:border-brand-primary"
                    }`}
                  >
                    <TypeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm font-semibold">{type.label}</span>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["Low", "Medium", "High", "Urgent"].map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority })}
                  className={`py-2 sm:py-3 rounded-lg font-semibold transition-all text-xs sm:text-sm ${
                    formData.priority === priority
                      ? "bg-brand-primary text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-brand-primary hover:text-white"
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
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all text-sm sm:text-base"
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
              rows={4}
              placeholder="Describe the issue in detail..."
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all resize-none text-sm sm:text-base"
            ></textarea>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Upload Photos (Optional)
            </label>
            
            {/* Hidden file input */}
            <input
              id="photo-upload-input"
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            
            {/* Upload area */}
            <div 
              onClick={openFileDialog}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 sm:p-8 text-center transition-colors cursor-pointer"
            >
              <Camera className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                PNG, JPG up to 10MB
              </p>
            </div>
            
            {/* Photo previews */}
            {photoPreviews.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Uploaded Photos ({photoPreviews.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-16 sm:h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 w-6 h-6 sm:w-8 sm:h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || isSubmittingReport}
              className="w-full bg-brand-primary hover:bg-brand-primaryDark text-white py-3 rounded-lg font-semibold text-base flex items-center justify-center gap-2 transition-colors"
            >
              {isSubmitting || isSubmittingReport ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Issue Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 sm:p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          Recent Reports
        </h2>
        <div className="space-y-3">
          {recentReports.map((report) => (
            <div
              key={report.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 mb-2 sm:mb-0">
                <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{report.haven}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{report.issue}</p>
                </div>
              </div>
              <div className="text-right sm:text-left">
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