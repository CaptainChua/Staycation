"use client";

import Skeleton from "@/Components/common/Skeleton";
import {
  CheckCircle2,
  Circle,
  BedDouble,
  Bath,
  ChefHat,
  Sofa,
  Sparkles,
  CalendarCheck,
  User,
  Home,
  AlertCircle,
  Camera,
  Upload,
} from "lucide-react";
import React, { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { useTranslations, type Lang } from "./translations";

type Task = {
  id: string;
  task: string;
  completed: boolean;
};

type Category = {
  category: string;
  tasks: Task[];
  icon?: React.ComponentType<{ className?: string }>;
};

type Haven = {
  id: string;
  name: string;
  address?: string;
  status?: string;
  bookingId?: string;
  guestName?: string;
  checkOutDate?: string;
  cleaningStatus?: string;
  isUpcoming?: boolean;
};

interface Props {
  /** Passed from MySchedulePage when "Start Cleaning" is clicked */
  initialHavenId?: string | null;
  /** booking_uuid from CleaningTask — scopes the checklist to this specific booking */
  initialBookingId?: string | null;
  lang?: Lang;
}

export default function CleaningChecklistPage({ initialHavenId, initialBookingId, lang = "en" }: Props = {}) {
  const t = useTranslations(lang);
  const [havens, setHavens] = useState<Haven[]>([]);
  const [selectedHavenId, setSelectedHavenId] = useState<string | null>(null);
  const [, setIsHavensLoading] = useState<boolean>(false);
  const [selectedHaven, setSelectedHaven] = useState<Haven | null>(null);

  const [checklist, setChecklist] = useState<Category[]>([]);
  const [checklistId, setChecklistId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [categoryPhotos, setCategoryPhotos] = useState<Record<string, string>>({});
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  const iconMap = {
    Bedroom: BedDouble,
    Bathroom: Bath,
    Kitchen: ChefHat,
    "Living Room": Sofa,
    General: Sparkles,
  };

  // Fetch havens on mount (only checked-out ones that need cleaning)
  useEffect(() => {
    let mounted = true;

    const fetchHavens = async () => {
      setIsHavensLoading(true);
      try {
        const url = initialHavenId
          ? `/api/admin/cleaners/havens?include_id=${encodeURIComponent(initialHavenId)}`
          : "/api/admin/cleaners/havens";
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        if (Array.isArray(data)) {
          setHavens(data);
          if (data.length > 0) {
            if (initialHavenId) {
              // Always trust the haven UUID passed from My Schedule.
              // Haven 5 may be the only "checked-out needing cleaning" haven in the
              // main list, but the clicked haven (via include_id) is prepended at
              // position 0 by the API.  Use initialHavenId directly so the checklist
              // is always fetched for the correct haven regardless of the list order.
              const exactMatch = data.find((h: Haven) => String(h.id) === String(initialHavenId));
              // data[0] is the include_id-matched haven (unshifted to front by API)
              const havenData = exactMatch ?? data[0];
              setSelectedHavenId(initialHavenId);
              setSelectedHaven(havenData);
            } else {
              // Direct tab navigation (no specific haven selected) — use currently
              // selected haven if still in list, otherwise the first available one.
              const stillExists = selectedHavenId
                ? data.find((h: Haven) => h.id === selectedHavenId)
                : null;
              const target = stillExists ?? data[0];
              setSelectedHavenId(target.id);
              setSelectedHaven(target);
            }
          } else {
            setSelectedHavenId(null);
            setSelectedHaven(null);
          }
        } else {
          toast.error("Failed to load havens");
        }
      } catch (err) {
        console.error("Failed to fetch havens", err);
        toast.error("Failed to load havens");
      } finally {
        setIsHavensLoading(false);
      }
    };

    fetchHavens();

    return () => {
      mounted = false;
    };
  }, [initialHavenId]);

  // Fetch checklist for a haven (optionally scoped to a specific booking)
  const fetchChecklist = useCallback(
    async (havenId: string, bookingId?: string | null) => {
      setIsLoading(true);
      try {
        let apiUrl = `/api/admin/cleaners?haven_id=${encodeURIComponent(havenId)}`;
        if (bookingId) apiUrl += `&booking_id=${encodeURIComponent(bookingId)}`;
        const res = await fetch(apiUrl, {
            cache: "no-store",
          });
        const payload = await res.json();
        if (res.ok && payload.success && payload.data?.checklist) {
          const { checklist } = payload.data;
          setChecklistId(checklist.id);
          setChecklist(checklist.categories || []);
          // Update haven info only when not already set from include_id response
          if (payload.data.haven) {
            setSelectedHaven(payload.data.haven);
          } else if (!initialHavenId) {
            // Only fall back to the havens list when no specific haven was passed in;
            // otherwise the correct haven data is already in selectedHaven.
            const found = havens.find((h) => h.id === checklist.haven_id);
            if (found) setSelectedHaven(found);
          }
        } else {
          throw new Error(payload.error || "Failed to load checklist");
        }
      } catch (err) {
        console.error("Failed to fetch checklist", err);
        setChecklist([]);
        setChecklistId(null);
        const message = err instanceof Error ? err.message : String(err);
        toast.error(message || "Failed to load checklist");
      } finally {
        setIsLoading(false);
      }
    },
    [havens]
  );

  const fetchPhotos = useCallback(async (checklistId: string) => {
    try {
      const res = await fetch(
        `/api/admin/cleaners/checklist-photos?checklist_id=${encodeURIComponent(checklistId)}`,
        { cache: "no-store" },
      );
      const payload = await res.json();
      if (res.ok && payload.success) {
        setCategoryPhotos(payload.data || {});
      }
    } catch {
      // non-fatal — photos just won't preload
    }
  }, []);

  const handlePhotoChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, categoryName: string) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !checklistId) return;

      setUploadingCategory(categoryName);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("checklist_id", checklistId);
        formData.append("category", categoryName);

        const res = await fetch("/api/admin/cleaners/checklist-photos", {
          method: "POST",
          body: formData,
        });
        const payload = await res.json();
        if (!res.ok || !payload.success) {
          throw new Error(payload.error || "Upload failed");
        }
        setCategoryPhotos((prev) => ({ ...prev, [categoryName]: payload.url }));
        toast.success(t.photoSaved);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast.error(message || "Upload failed");
      } finally {
        setUploadingCategory(null);
      }
    },
    [checklistId, t.photoSaved],
  );

  // Separately fetch haven info for the booking card (only used when no initialHavenId
  // was provided, i.e., direct tab navigation).  When initialHavenId IS provided, the
  // haven data is already set from the include_id response and we must NOT overwrite it
  // with the main havens list which may not contain the upcoming haven.
  const fetchHavenInfo = useCallback(async (havenId: string) => {
    if (initialHavenId) return; // haven info already set from include_id response
    try {
      const res = await fetch(`/api/admin/cleaners/havens`, { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        const found = data.find((h: Haven) => String(h.id) === String(havenId));
        if (found) setSelectedHaven(found);
      }
    } catch {
      // non-fatal — booking info card just won't show
    }
  }, [initialHavenId]);

  useEffect(() => {
    if (selectedHavenId) {
      fetchChecklist(selectedHavenId, initialBookingId);
      fetchHavenInfo(selectedHavenId);
    } else {
      setChecklist([]);
      setChecklistId(null);
      setSelectedHaven(null);
    }
  }, [selectedHavenId, initialBookingId, fetchChecklist, fetchHavenInfo]);

  useEffect(() => {
    if (checklistId) {
      fetchPhotos(checklistId);
    } else {
      setCategoryPhotos({});
    }
  }, [checklistId, fetchPhotos]);


  const handleHavenChange = (havenId: string | null) => {
    setSelectedHavenId(havenId);
    setProofFile(null);
    setProofPreview(null);
    setProofUploaded(false);
    if (havenId) {
      const found = havens.find((h) => h.id === havenId);
      setSelectedHaven(found ?? null);
    } else {
      setSelectedHaven(null);
    }
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP, or PDF files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setProofFile(file);
    setProofPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    setProofUploaded(false);
  };

  const handleUploadProof = async () => {
    if (!proofFile) return;
    setIsUploadingProof(true);
    try {
      const reader = new FileReader();
      await new Promise<void>((resolve, reject) => {
        reader.onloadend = () => resolve();
        reader.onerror = reject;
        reader.readAsDataURL(proofFile);
      });
      await new Promise((r) => setTimeout(r, 800));
      setProofUploaded(true);
      toast.success("Proof of payment uploaded successfully!");
    } catch {
      toast.error("Failed to upload proof. Please try again.");
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleRemoveProof = () => {
    setProofFile(null);
    setProofPreview(null);
    setProofUploaded(false);
    if (proofInputRef.current) proofInputRef.current.value = "";
  };

  const toggleTask = async (taskId: string) => {
    let newCompleted = false;
    setChecklist((prev) =>
      prev.map((category: Category) => ({
        ...category,
        tasks: category.tasks.map((task: Task) => {
          if (task.id === taskId) {
            newCompleted = !task.completed;
            return { ...task, completed: newCompleted };
          }
          return task;
        }),
      })),
    );
    try {
      const res = await fetch("/api/admin/cleaners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, completed: newCompleted }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Failed to update task");
      toast.success("Task updated");
    } catch (err) {
      console.error("Failed to update task:", err);
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || "Failed to update task");
      if (selectedHavenId) fetchChecklist(selectedHavenId, initialBookingId);
    }
  };

  // Progress: General checkboxes + photo uploads for other categories
  const generalCategory = checklist.find((c) => c.category === "General");
  const photoCategories = checklist.filter((c) => c.category !== "General");
  const completedTasks = generalCategory?.tasks.filter((t) => t.completed).length ?? 0;
  const totalTasks = generalCategory?.tasks.length ?? 0;
  const completedPhotos = photoCategories.filter((c) => !!categoryPhotos[c.category]).length;
  const totalPhotos = photoCategories.length;
  const totalItems = totalTasks + totalPhotos;
  const completedItems = completedTasks + completedPhotos;
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Empty / no task selected — shown when navigating directly to the tab without clicking Start Cleaning
  if (!initialHavenId && !isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {t.checklistTitle}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t.checklistSubtitle}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
            <AlertCircle className="w-12 h-12 text-blue-500 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {t.noTaskSelected}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            {t.noTaskMsg}{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-200">{t.noTaskDesc1}</span>{" "}
            {t.noTaskMsg2}{" "}
            <span className="font-semibold text-brand-primary">{t.noTaskDesc2}</span>{" "}
            {t.noTaskMsg3}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
          {t.checklistTitle}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t.checklistSubtitle}
        </p>
      </div>

      {/* Booking Info Card */}
      {selectedHaven && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 border-l-4 border-brand-primary">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Home className="w-4 h-4 text-brand-primary" />
              <span className="font-medium">{selectedHaven.name}</span>
              {selectedHaven.address && (
                <span className="text-gray-400 dark:text-gray-500">
                  ({selectedHaven.address})
                </span>
              )}
            </div>
            {selectedHaven.guestName && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4" />
                <span>{t.guest} {selectedHaven.guestName}</span>
              </div>
            )}
            {selectedHaven.checkOutDate && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <CalendarCheck className="w-4 h-4" />
                <span>{t.checkedOut} {selectedHaven.checkOutDate}</span>
              </div>
            )}
            {selectedHaven.bookingId && (
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {t.bookingHash}{selectedHaven.bookingId}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming notice */}
      {selectedHaven?.isUpcoming && (
        <div className="flex items-start gap-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-300 dark:border-sky-700 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">{t.upcomingTitle}</p>
            <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
              {t.upcomingMsg(selectedHaven.checkOutDate ?? "")}
            </p>
          </div>
        </div>
      )}


      {/* Progress Overview */}
      {!isLoading && checklist.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Overall Progress</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {completedTasks}/{totalTasks} tasks &middot; {completedPhotos}/{totalPhotos} photos
              </p>
            </div>
            <span className={`text-3xl font-bold ${progressPct === 100 ? "text-green-500" : "text-brand-primary"}`}>
              {progressPct}%
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${progressPct === 100 ? "bg-green-500" : "bg-brand-primary"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist by Category */}
      <div className="space-y-4">
        {isLoading && (
          <div aria-busy="true" aria-live="polite" className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Skeleton className="h-5 w-40 rounded mb-2" label="Loading progress title" />
                  <Skeleton className="h-3 w-28 rounded" label="Loading progress detail" />
                </div>
                <Skeleton className="h-10 w-14 rounded" label="Loading progress number" />
              </div>
              <Skeleton className="h-3 w-3/5 rounded-full" label="Loading progress bar" />
            </div>

            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" label="Loading category icon" />
                    <div>
                      <Skeleton className="h-4 w-32 rounded mb-1" label="Loading category name" />
                      <Skeleton className="h-3 w-20 rounded" label="Loading category meta" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-12 rounded" label="Loading category stat" />
                </div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((t) => (
                    <div key={t} className="flex items-center gap-3 p-3 rounded-lg">
                      <Skeleton className="w-5 h-5 rounded-full" label="Loading task icon" />
                      <Skeleton className="h-4 w-full rounded" label="Loading task" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading &&
          checklist.map((category: Category) => {
            const CategoryIcon =
              (iconMap as Record<string, typeof Sparkles>)[category.category] ?? Sparkles;
            return (
              <div
                key={category.category}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-brand-primary text-white p-3 rounded-lg">
                    <CategoryIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">
                    {category.category}
                  </h3>
                </div>

                {/* Tasks — General only */}
                {category.category === "General" && (
                  <div className="space-y-2">
                    {category.tasks.map((task: Task) => (
                      <div
                        key={task.id}
                        onClick={() => { if (!selectedHaven?.isUpcoming) toggleTask(task.id); }}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${selectedHaven?.isUpcoming ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${
                          task.completed
                            ? "bg-green-50 dark:bg-green-900/20"
                            : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                        <span
                          className={`flex-1 text-sm ${
                            task.completed
                              ? "text-green-700 dark:text-green-400 line-through"
                              : "text-gray-800 dark:text-gray-100"
                          }`}
                        >
                          {task.task}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Photo proof — Bedroom, Bathroom, Kitchen, Living Room */}
                {category.category !== "General" && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t.photoProof}
                      </span>
                    </div>

                    {categoryPhotos[category.category] && (
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(categoryPhotos[category.category])}
                        className="mb-3 relative block group focus:outline-none"
                        aria-label={`View ${category.category} photo`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={categoryPhotos[category.category]}
                          alt={`${category.category} proof`}
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 group-hover:opacity-90 transition-opacity"
                        />
                        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
                          <span className="text-white text-xs font-semibold px-2 py-1 bg-black/50 rounded-md">
                            {t.photoTapChange}
                          </span>
                        </span>
                      </button>
                    )}

                    <input
                      type="file"
                      id={`upload-${category.category}`}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoChange(e, category.category)}
                    />
                    <input
                      type="file"
                      id={`camera-${category.category}`}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handlePhotoChange(e, category.category)}
                    />

                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        disabled={uploadingCategory === category.category || !!selectedHaven?.isUpcoming}
                        onClick={() => document.getElementById(`camera-${category.category}`)?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {uploadingCategory === category.category ? t.photoUploading : t.takePic}
                      </button>
                      <button
                        type="button"
                        disabled={uploadingCategory === category.category || !!selectedHaven?.isUpcoming}
                        onClick={() => document.getElementById(`upload-${category.category}`)?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingCategory === category.category ? t.photoUploading : t.uploadPhoto}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Action / Status */}
      {!selectedHaven?.isUpcoming && !isLoading && checklist.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.autoSave}</p>
          </div>

          <button
            type="button"
            disabled={!checklistId}
            onClick={async () => {
              try {
                const res = await fetch("/api/admin/cleaners", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "submit",
                    checklist_id: checklistId,
                  }),
                });
                const payload = await res.json();
                if (!res.ok || !payload?.success) {
                  throw new Error(payload?.error || "Failed to submit checklist");
                }
                toast.success("Checklist submitted successfully");
              } catch (err) {
                console.error("Submit checklist error:", err);
                const message = err instanceof Error ? err.message : String(err);
                toast.error(message || "Failed to submit checklist");
              }
            }}
            className="w-full sm:w-auto font-semibold rounded-lg px-6 py-2.5 transition-colors flex items-center justify-center gap-2 bg-brand-primary text-white hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            {t.confirmFinish}
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Photo proof"
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
