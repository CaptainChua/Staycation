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
} from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
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
  const [havens, setHavens] = useState<Haven[]>([]);
  const [selectedHavenId, setSelectedHavenId] = useState<string | null>(null);
  const [isHavensLoading, setIsHavensLoading] = useState<boolean>(false);
  const [selectedHaven, setSelectedHaven] = useState<Haven | null>(null);

  const [checklist, setChecklist] = useState<Category[]>([]);
  const [checklistId, setChecklistId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

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
  }, [selectedHavenId, fetchChecklist, fetchHavenInfo]);

  const toggleTask = async (taskId: string) => {
    let newCompleted = false;

    // Optimistically update UI
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

  const totalTasks = checklist.reduce((acc, cat) => acc + cat.tasks.length, 0);
  const completedTasks = checklist.reduce(
    (acc, cat: Category) => acc + cat.tasks.filter((t: Task) => t.completed).length,
    0,
  );
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const canComplete = progress === 100;

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

      {/* Upcoming notice */}
      {selectedHaven?.isUpcoming && (
        <div className="flex items-start gap-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-300 dark:border-sky-700 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">Guest has not checked out yet</p>
            <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
              You can preview the checklist to prepare, but cleaning tasks will be unlocked after the guest checks out on{" "}
              <span className="font-semibold">{selectedHaven.checkOutDate}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Progress Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
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
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              progress === 100 ? "bg-green-500" : "bg-brand-primary"
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>


      {/* Checklist by Category */}
      <div className="space-y-4">
        {isLoading && (
          <div aria-busy="true" aria-live="polite" className="space-y-4">
            {/* Progress skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Skeleton
                    className="h-5 w-40 rounded mb-2"
                    label="Loading progress title"
                  />
                  <Skeleton
                    className="h-3 w-28 rounded"
                    label="Loading progress detail"
                  />
                </div>
                <Skeleton
                  className="h-10 w-14 rounded"
                  label="Loading progress number"
                />
              </div>
              <div className="w-full">
                <Skeleton
                  className="h-3 w-3/5 rounded-full"
                  label="Loading progress bar"
                />
              </div>
            </div>

            {/* Category skeletons */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton
                      className="w-10 h-10 rounded-lg"
                      label="Loading category icon"
                    />
                    <div>
                      <Skeleton
                        className="h-4 w-32 rounded mb-1"
                        label="Loading category name"
                      />
                      <Skeleton
                        className="h-3 w-20 rounded"
                        label="Loading category meta"
                      />
                    </div>
                  </div>
                  <Skeleton
                    className="h-6 w-12 rounded"
                    label="Loading category stat"
                  />
                </div>

                <div className="space-y-2">
                  {[1, 2, 3, 4].map((t) => (
                    <div
                      key={t}
                      className="flex items-center gap-3 p-3 rounded-lg"
                    >
                      <Skeleton
                        className="w-5 h-5 rounded-full"
                        label="Loading task icon"
                      />
                      <Skeleton
                        className="h-4 w-full rounded"
                        label="Loading task"
                      />
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
              (iconMap as Record<string, typeof Sparkles>)[category.category] ??
              Sparkles;
            const categoryCompleted = category.tasks.filter(
              (t) => t.completed,
            ).length;
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
              </div>
            );
          })}
      </div>

      {/* Action / Status */}
      {!selectedHaven?.isUpcoming && <div className="flex flex-col sm:flex-row gap-3 items-center">
        <p className="text-sm text-gray-500 flex-1 text-center sm:text-left">Changes are saved automatically</p>
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

      {progress < 100 && (
        <p className="text-xs text-gray-500 mt-2">
          Complete all tasks to enable submission.
        </p>
      )}
    </div>
  );
}
