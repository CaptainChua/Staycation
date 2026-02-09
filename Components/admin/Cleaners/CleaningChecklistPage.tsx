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

export default function CleaningChecklistPage() {
  const [havens, setHavens] = useState<Haven[]>([]);
  const [selectedHavenId, setSelectedHavenId] = useState<string | null>(null);
  const [selectedHaven, setSelectedHaven] = useState<Haven | null>(null);
  const [isHavensLoading, setIsHavensLoading] = useState<boolean>(true);

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

  // Fetch havens on mount (only checked-out ones that need cleaning)
  useEffect(() => {
    let mounted = true;

    const fetchHavens = async () => {
      setIsHavensLoading(true);
      try {
        const res = await fetch("/api/admin/cleaners/havens", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!mounted) return;
        if (Array.isArray(data)) {
          setHavens(data);
          if (data.length > 0) {
            // If the currently selected haven is no longer in the list, reset
            const stillExists = selectedHavenId
              ? data.find((h: Haven) => h.id === selectedHavenId)
              : null;
            if (!stillExists) {
              setSelectedHavenId(data[0].id);
              setSelectedHaven(data[0]);
            } else {
              setSelectedHaven(stillExists);
            }
          } else {
            setSelectedHavenId(null);
            setSelectedHaven(null);
          }
        } else {
          toast.error("Failed to load havens");
        }
      } catch (err) {
        console.error("Error loading havens", err);
        toast.error("Failed to load havens");
      } finally {
        if (mounted) setIsHavensLoading(false);
      }
    };

    fetchHavens();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch checklist for a haven
  const fetchChecklist = useCallback(
    async (havenId: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/admin/cleaners?haven_id=${encodeURIComponent(havenId)}`,
          {
            cache: "no-store",
          },
        );
        const payload = await res.json();
        if (res.ok && payload.success && payload.data?.checklist) {
          const { checklist } = payload.data;
          setChecklistId(checklist.id);
          setChecklist(checklist.categories || []);
          const found = havens.find((h) => h.id === checklist.haven_id);
          if (found) setSelectedHaven(found);
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
    [havens],
  );

  useEffect(() => {
    if (selectedHavenId) {
      fetchChecklist(selectedHavenId);
    } else {
      setChecklist([]);
      setChecklistId(null);
      setSelectedHaven(null);
    }
  }, [selectedHavenId, fetchChecklist]);

  // Update selectedHaven when haven selection changes
  const handleHavenChange = (havenId: string | null) => {
    setSelectedHavenId(havenId);
    if (havenId) {
      const found = havens.find((h) => h.id === havenId);
      setSelectedHaven(found ?? null);
    } else {
      setSelectedHaven(null);
    }
  };

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
        if (selectedHavenId) {
          await fetchChecklist(selectedHavenId);
          toast.success(
            "Task updated; checklist refreshed (task moved to latest)",
          );
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
      // Re-fetch checklist to sync state if update failed
      if (selectedHavenId) {
        fetchChecklist(selectedHavenId);
      }
    }
  };

  const totalTasks = checklist.reduce((acc, cat) => acc + cat.tasks.length, 0);
  const completedTasks = checklist.reduce(
    (acc, cat: Category) =>
      acc + cat.tasks.filter((t: Task) => t.completed).length,
    0,
  );
  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Empty state: no havens need cleaning
  if (!isHavensLoading && havens.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Cleaning Checklist
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete cleaning tasks for checked-out havens
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            All Clean!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            There are no havens that need cleaning right now. Havens will appear
            here once guests have checked out and cleaning is needed.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <span>
              Cleaning tasks are created automatically after guest checkout
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Cleaning Checklist
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete cleaning tasks for checked-out havens
          </p>
        </div>

        <div className="min-w-[220px]">
          <label htmlFor="haven-select" className="sr-only">
            Select haven
          </label>
          {isHavensLoading ? (
            <Skeleton
              className="h-9 w-full rounded-lg"
              label="Loading havens"
            />
          ) : (
            <select
              id="haven-select"
              value={selectedHavenId ?? ""}
              onChange={(e) => handleHavenChange(e.target.value || null)}
              className="w-full rounded-lg border-gray-200 bg-white dark:bg-gray-800 text-sm py-2 px-3"
            >
              {havens.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                  {h.guestName ? ` — ${h.guestName}` : ""}
                </option>
              ))}
            </select>
          )}
        </div>
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Overall Progress
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {completedTasks} of {totalTasks} tasks completed
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-brand-primary">{progress}%</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-brand-primary h-3 rounded-full transition-all duration-500"
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
      <div className="flex gap-3">
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          Changes are saved automatically
        </div>
      </div>

      {progress < 100 && (
        <p className="text-xs text-gray-500 mt-2">
          Complete all tasks to enable submission.
        </p>
      )}
    </div>
  );
}
