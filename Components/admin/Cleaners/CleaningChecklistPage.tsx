"use client";

import {
  CheckCircle2,
  Circle,
  BedDouble,
  Bath,
  ChefHat,
  Sofa,
  Sparkles,
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

export default function CleaningChecklistPage() {
  const [havens, setHavens] = useState<{ id: string; name: string }[]>([]);
  const [selectedHavenId, setSelectedHavenId] = useState<string | null>(null);
  const [selectedHavenName, setSelectedHavenName] = useState<string | null>(
    null,
  );

  const [checklist, setChecklist] = useState<Category[]>([]);
  const [checklistId, setChecklistId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const iconMap = {
    Bedroom: BedDouble,
    Bathroom: Bath,
    Kitchen: ChefHat,
    "Living Room": Sofa,
    General: Sparkles,
  };

  // Fetch havens on mount
  useEffect(() => {
    let mounted = true;

    const fetchHavens = async () => {
      try {
        const res = await fetch("/api/admin/cleaners/havens", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!mounted) return;
        if (Array.isArray(data)) {
          setHavens(data);
          if (!selectedHavenId && data.length > 0) {
            setSelectedHavenId(data[0].id);
            setSelectedHavenName(data[0].name);
          }
        } else {
          toast.error("Failed to load havens");
        }
      } catch (err) {
        console.error("Error loading havens", err);
        toast.error("Failed to load havens");
      }
    };

    fetchHavens();
    return () => {
      mounted = false;
    };
  }, [selectedHavenId]);

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
          setSelectedHavenName(found?.name ?? "");
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
      setSelectedHavenName(null);
    }
  }, [selectedHavenId, fetchChecklist]);

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

      // If the server moved this task to a different checklist (e.g. during dedupe),
      // the returned task will include the authoritative `checklist_id`. If that
      // differs from the checklist currently shown, refresh the checklist for the
      // haven so the UI stays in sync.
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

  const saveProgress = useCallback(async () => {
    if (!checklistId) {
      toast.error("No checklist selected");
      return;
    }
    setIsSaving(true);
    try {
      const tasksPayload = checklist.flatMap((cat: Category) =>
        cat.tasks.map((t: Task) => ({ id: t.id, completed: t.completed })),
      );

      const res = await fetch("/api/admin/cleaners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          checklist_id: checklistId,
          tasks: tasksPayload,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        const message = payload?.error || "Failed to save progress";
        throw new Error(message);
      }
      toast.success(payload?.message || "Progress saved");

      // Refresh the checklist after saving to ensure UI matches server state
      if (selectedHavenId) {
        await fetchChecklist(selectedHavenId);
      }
    } catch (err) {
      console.error("Save progress failed:", err);
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || "Failed to save progress");
    } finally {
      setIsSaving(false);
    }
  }, [checklistId, checklist, selectedHavenId, fetchChecklist]);

  const submitChecklist = useCallback(async () => {
    if (!checklistId) {
      toast.error("No checklist selected");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/cleaners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", checklist_id: checklistId }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to submit checklist");
      }

      toast.success(payload?.message || "Checklist submitted");
      // Refresh after successful submission
      if (selectedHavenId) {
        fetchChecklist(selectedHavenId);
      }
    } catch (err) {
      console.error("Submit failed:", err);
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || "Failed to submit checklist");
    } finally {
      setIsSubmitting(false);
    }
  }, [checklistId, selectedHavenId, fetchChecklist]);

  const totalTasks = checklist.reduce((acc, cat) => acc + cat.tasks.length, 0);
  const completedTasks = checklist.reduce(
    (acc, cat: Category) =>
      acc + cat.tasks.filter((t: Task) => t.completed).length,
    0,
  );
  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Cleaning Checklist
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete all tasks for {selectedHavenName ?? "—"}
          </p>
        </div>

        <div className="min-w-[220px]">
          <label htmlFor="haven-select" className="sr-only">
            Select haven
          </label>
          <select
            id="haven-select"
            value={selectedHavenId ?? ""}
            onChange={(e) => setSelectedHavenId(e.target.value || null)}
            className="w-full rounded-lg border-gray-200 bg-white dark:bg-gray-800 text-sm py-2 px-3"
          >
            {havens.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg text-center">
            Loading checklist...
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

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={submitChecklist}
          disabled={isSubmitting || isLoading || progress < 100}
          className={`flex-1 bg-brand-primary hover:bg-brand-primaryDark text-white py-3 rounded-lg font-semibold transition-colors ${isSubmitting || isLoading || progress < 100 ? "opacity-60 cursor-not-allowed" : ""}`}
          title={
            isLoading
              ? "Loading checklist..."
              : progress < 100
                ? "Complete all tasks before submitting"
                : undefined
          }
        >
          {isSubmitting ? "Submitting..." : "Submit Checklist"}
        </button>
        <button
          onClick={saveProgress}
          disabled={isSaving || isLoading}
          className={`flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 py-3 rounded-lg font-semibold transition-colors ${isSaving || isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          title={isLoading ? "Loading checklist..." : undefined}
        >
          {isSaving ? "Saving..." : "Save Progress"}
        </button>
      </div>

      {progress < 100 && (
        <p className="text-xs text-gray-500 mt-2">
          Complete all tasks to enable submission.
        </p>
      )}
    </div>
  );
}
