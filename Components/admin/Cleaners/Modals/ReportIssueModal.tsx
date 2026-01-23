"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { AlertTriangle, Wrench, PackageMinus, Droplets, Zap, FileText, Camera, Send, Loader2, X, Edit } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useGetHavensQuery } from "@/redux/api/roomApi";
import { useSubmitReportMutation, useUpdateReportMutation, ReportIssueRequest } from "@/redux/api/reportApi";
import { Haven } from "@/types/Haven";

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  reportId?: string;
  initialData?: {
    haven?: string;
    issueType?: string;
    priority?: string;
    description?: string;
    location?: string;
    images?: Array<{ image_url: string; cloudinary_public_id?: string }>;
  };
}

export default function ReportIssueModal({ isOpen, onClose, onSuccess, reportId, initialData }: ReportIssueModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isEditMode = !!reportId && !!initialData;
  
  const [formData, setFormData] = useState({
    haven: initialData?.haven || "",
    issueType: initialData?.issueType || "",
    priority: initialData?.priority || "Medium",
    description: initialData?.description || "",
    location: initialData?.location || "",
  });

  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>(initialData?.images?.map(img => img.image_url) || []);
  const [existingImages, setExistingImages] = useState<Array<{ image_url: string; cloudinary_public_id?: string }>>(initialData?.images || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch havens from API
  const { data: session } = useSession();
  const { data: havens, isLoading, isError } = useGetHavensQuery({});
  const [submitReport, { isLoading: isSubmittingReport }] = useSubmitReportMutation();
  const [updateReport, { isLoading: isUpdatingReport }] = useUpdateReportMutation();

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        setFormData({
          haven: initialData.haven || "",
          issueType: initialData.issueType || "",
          priority: initialData.priority || "Medium",
          description: initialData.description || "",
          location: initialData.location || "",
        });
        setPhotoPreviews(initialData.images?.map(img => img.image_url) || []);
        setExistingImages(initialData.images || []);
        setUploadedPhotos([]);
      } else {
        setFormData({
          haven: "",
          issueType: "",
          priority: "Medium",
          description: "",
          location: "",
        });
        setPhotoPreviews([]);
        setExistingImages([]);
        setUploadedPhotos([]);
      }
      setSubmitSuccess(false);
    }
  }, [isOpen, isEditMode, initialData]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validation
    if (!session?.user?.id) {
      toast.error("You must be logged in to submit a report");
      setIsSubmitting(false);
      return;
    }
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
        user_id: session.user.id,
        images: uploadedPhotos
      };

      // Submit or update report
      if (isEditMode && reportId) {
        await updateReport({ reportId, ...reportData }).unwrap();
        toast.success("Report updated successfully!");
      } else {
        await submitReport(reportData).unwrap();
        toast.success("Report submitted successfully!");
      }
      
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
        setExistingImages([]);
        setSubmitSuccess(false);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting report:", error);
      
      // Handle RTK Query error structure
      let errorMessage = "Failed to submit report. Please try again.";
      
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.data?.status) {
        errorMessage = error.data.status;
      } else if (error?.status) {
        errorMessage = `HTTP ${error.status}: ${error.statusText || 'Server Error'}`;
      } else if (typeof error === 'string') {
        errorMessage = error;
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
    document.getElementById('photo-upload-input-modal')?.click();
  };

  const handleClose = () => {
    if (!isSubmitting && !isSubmittingReport && !isUpdatingReport) {
      // Reset form when closing
      setFormData({
        haven: "",
        issueType: "",
        priority: "Medium",
        description: "",
        location: "",
      });
      setUploadedPhotos([]);
      setPhotoPreviews([]);
      setExistingImages([]);
      setSubmitSuccess(false);
      onClose();
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (modalRef.current && !modalRef.current.contains(target)) {
      if (!isSubmitting && !isSubmittingReport && !isUpdatingReport) {
        handleClose();
      }
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
  }, [isOpen, isSubmitting, isSubmittingReport, isUpdatingReport]);

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
                {isEditMode ? "Edit Report" : "Report Issue"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isEditMode ? "Update the report details" : "Report any issues found during cleaning"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting || isSubmittingReport || isUpdatingReport}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {submitSuccess ? (
              <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {isEditMode ? "Report Updated Successfully!" : "Report Submitted Successfully!"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isEditMode ? "The report has been updated successfully." : "Your issue report has been submitted and will be reviewed."}
              </p>
            </div>
          ) : (
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
                  id="photo-upload-input-modal"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                
                {/* Upload area */}
                <div 
                  onClick={openFileDialog}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 sm:p-8 text-center transition-colors cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5"
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
                {(photoPreviews.length > 0 || existingImages.length > 0) && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {isEditMode ? "Current Photos" : "Uploaded Photos"} ({photoPreviews.length + existingImages.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                      {/* Existing images (from database) */}
                      {existingImages.map((img, index) => (
                        <div key={`existing-${index}`} className="relative group">
                          <img
                            src={img.image_url}
                            alt={`Existing image ${index + 1}`}
                            className="w-full h-16 sm:h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                          />
                          <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                            Existing
                          </div>
                        </div>
                      ))}
                      {/* New uploaded images */}
                      {photoPreviews.map((preview, index) => {
                        // Skip if it's an existing image URL
                        if (existingImages.some(img => img.image_url === preview)) return null;
                        return (
                          <div key={`new-${index}`} className="relative group">
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
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || isSubmittingReport || isUpdatingReport}
                  className="w-full bg-brand-primary hover:bg-brand-primaryDark text-white py-3 rounded-lg font-semibold text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isSubmitting || isSubmittingReport || isUpdatingReport) ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{isEditMode ? "Updating..." : "Submitting..."}</span>
                    </>
                  ) : (
                    <>
                      {isEditMode ? <Edit className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                      <span>{isEditMode ? "Update Report" : "Submit Issue Report"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
