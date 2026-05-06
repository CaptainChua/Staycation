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
  Upload,
  X,
  ShieldCheck,
} from "lucide-react";
import React, { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";

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
};

interface Props {
  /** Passed from MySchedulePage when "Start Cleaning" is clicked */
  initialHavenId?: string | null;
}

export default function CleaningChecklistPage({ initialHavenId }: Props = {}) {
  const [selectedHaven, setSelectedHaven] = useState<Haven | null>(null);

  const [checklist, setChecklist] = useState<Category[]>([]);
  const [checklistId, setChecklistId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const iconMap = {
    Bedroom: BedDouble,
    Bathroom: Bath,
    Kitchen: ChefHat,
    "Living Room": Sofa,
    General: Sparkles,
  };

  // Fetch checklist for the haven passed via prop (set by MySchedulePage → Start Cleaning)
  const fetchChecklist = useCallback(async (havenId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/cleaners?haven_id=${encodeURIComponent(havenId)}`,
        { cache: "no-store" },
      );
      const payload = await res.json();
      if (res.ok && payload.success && payload.data?.checklist) {
        const { checklist } = payload.data;
        setChecklistId(checklist.id);
        setChecklist(checklist.categories || []);
        // Use haven info if the API returns it alongside the checklist
        if (payload.data.haven) {
          setSelectedHaven(payload.data.haven);
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
  }, []);

  // Separately fetch haven info for the booking card (in case checklist endpoint doesn't return it)
  const fetchHavenInfo = useCallback(async (havenId: string) => {
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
  }, []);

  useEffect(() => {
    if (initialHavenId) {
      fetchChecklist(initialHavenId);
      fetchHavenInfo(initialHavenId);
    } else {
      setChecklist([]);
      setChecklistId(null);
      setSelectedHaven(null);
    }
  }, [initialHavenId, fetchChecklist, fetchHavenInfo]);

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
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to update task");
      }

      const returnedTask = payload?.data?.task;
      if (
        returnedTask &&
        returnedTask.checklist_id &&
        returnedTask.checklist_id !== checklistId
      ) {
        if (initialHavenId) {
          await fetchChecklist(initialHavenId);
          toast.success("Task updated; checklist refreshed (task moved to latest)");
        } else {
          toast.success("Task updated");
        }
        return;
      }

      toast.success("Task updated");
    } catch (err) {
      console.error("Failed to update task:", err);
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || "Failed to update task");
      if (initialHavenId) fetchChecklist(initialHavenId);
    }
  };

  const totalTasks = checklist.reduce((acc, cat) => acc + cat.tasks.length, 0) + 1;
  const completedTasks =
    checklist.reduce(
      (acc, cat: Category) => acc + cat.tasks.filter((t: Task) => t.completed).length,
      0,
    ) + (proofUploaded ? 1 : 0);
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const canComplete = proofUploaded;

  // Empty / no task selected — shown when navigating directly to the tab without clicking Start Cleaning
  if (!initialHavenId && !isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Cleaning Checklist
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete cleaning tasks for your assigned haven
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
            <AlertCircle className="w-12 h-12 text-blue-500 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            No Task Selected
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Go to{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-200">My Schedule</span> and
            tap{" "}
            <span className="font-semibold text-brand-primary">Start Cleaning</span> on your
            assigned haven to begin the checklist.
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
          Cleaning Checklist
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Complete cleaning tasks for your assigned haven
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
                <span>Guest: {selectedHaven.guestName}</span>
              </div>
            )}
            {selectedHaven.checkOutDate && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <CalendarCheck className="w-4 h-4" />
                <span>Checked out: {selectedHaven.checkOutDate}</span>
              </div>
            )}
            {selectedHaven.bookingId && (
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Booking #{selectedHaven.bookingId}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Overall Progress
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-brand-primary text-base">
                {completedTasks}/{totalTasks}
              </span>{" "}
              tasks completed
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-brand-primary">{progress}%</p>
            {!canComplete && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Proof required</p>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              progress === 100 ? "bg-green-500" : "bg-brand-primary"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Proof of Payment */}
      {!isLoading && (
        <div
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 sm:p-6 border-2 ${
            proofUploaded
              ? "border-green-400 dark:border-green-600"
              : "border-amber-400 dark:border-amber-600"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-lg ${
                  proofUploaded ? "bg-green-500" : "bg-amber-500"
                } text-white`}
              >
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm sm:text-base">
                    Upload Proof of Payment
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Required
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Security deposit receipt or screenshot
                </p>
              </div>
            </div>
            {proofUploaded && (
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
            )}
          </div>

          {!proofUploaded ? (
            <div className="space-y-3">
              {!proofFile ? (
                <button
                  type="button"
                  onClick={() => proofInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg p-6 flex flex-col items-center gap-2 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-amber-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tap to upload receipt
                  </span>
                  <span className="text-xs text-gray-400">
                    JPG, PNG, WEBP or PDF · Max 10MB
                  </span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {proofPreview ? (
                      <img
                        src={proofPreview}
                        alt="Proof preview"
                        className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {proofFile.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(proofFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveProof}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleUploadProof}
                    disabled={isUploadingProof}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    {isUploadingProof ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Confirm Upload
                      </>
                    )}
                  </button>
                </div>
              )}
              <input
                ref={proofInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleProofFileChange}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              {proofPreview && (
                <img
                  src={proofPreview}
                  alt="Uploaded proof"
                  className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Proof uploaded successfully
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {proofFile?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveProof}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                Remove
              </button>
            </div>
          )}
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
            const categoryCompleted = category.tasks.filter((t) => t.completed).length;
            const categoryTotal = category.tasks.length;
            const categoryProgress = Math.round(
              (categoryCompleted / Math.max(1, categoryTotal)) * 100,
            );

            return (
              <div
                key={category.category}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-brand-primary text-white p-3 rounded-lg">
                      <CategoryIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-100">
                        {category.category}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {categoryCompleted} of {categoryTotal} completed
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-brand-primary">
                    {categoryProgress}%
                  </span>
                </div>

                <div className="space-y-2">
                  {category.tasks.map((task: Task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
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
              </div>
            );
          })}
      </div>

      {/* Action / Status */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <p className="text-sm text-gray-500 flex-1 text-center sm:text-left">
          Changes are saved automatically
        </p>
        {!canComplete && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            ⚠ Upload proof of payment to complete the checklist
          </p>
        )}
        {canComplete && progress === 100 && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            All tasks complete!
          </div>
        )}

        {/* Finalize checklist: mark checklist as completed in backend */}
        {canComplete && progress === 100 && checklistId && (
          <button
            type="button"
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
            className="flex-1 sm:flex-none w-full sm:w-auto bg-brand-primary text-white font-semibold rounded-lg px-4 py-2.5 hover:bg-brand-primary/90 transition-colors"
          >
            Confirm & Finish
          </button>
        )}
      </div>
    </div>
  );
}