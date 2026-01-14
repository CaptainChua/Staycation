"use client";

import { CheckCircle2, Circle, BedDouble, Bath, ChefHat, Sofa, Sparkles } from "lucide-react";
import { useState } from "react";

export default function CleaningChecklistPage() {
  const [selectedHaven] = useState("Haven 3");

  const [checklist, setChecklist] = useState([
    {
      category: "Bedroom",
      icon: BedDouble,
      tasks: [
        { id: 1, task: "Make bed and change linens", completed: true },
        { id: 2, task: "Dust furniture and surfaces", completed: true },
        { id: 3, task: "Vacuum floor and rugs", completed: false },
        { id: 4, task: "Clean mirrors and windows", completed: false },
        { id: 5, task: "Empty trash bin", completed: true },
      ],
    },
    {
      category: "Bathroom",
      icon: Bath,
      tasks: [
        { id: 6, task: "Clean toilet, sink, and shower", completed: false },
        { id: 7, task: "Replace towels and toiletries", completed: false },
        { id: 8, task: "Mop floor", completed: false },
        { id: 9, task: "Clean mirror", completed: false },
        { id: 10, task: "Restock supplies", completed: false },
      ],
    },
    {
      category: "Kitchen",
      icon: ChefHat,
      tasks: [
        { id: 11, task: "Clean countertops and sink", completed: false },
        { id: 12, task: "Wipe down appliances", completed: false },
        { id: 13, task: "Clean microwave inside and out", completed: false },
        { id: 14, task: "Mop floor", completed: false },
        { id: 15, task: "Take out trash and recycling", completed: false },
      ],
    },
    {
      category: "Living Room",
      icon: Sofa,
      tasks: [
        { id: 16, task: "Vacuum sofa and cushions", completed: false },
        { id: 17, task: "Dust all surfaces", completed: false },
        { id: 18, task: "Clean TV and entertainment center", completed: false },
        { id: 19, task: "Vacuum or mop floor", completed: false },
        { id: 20, task: "Arrange furniture and decor", completed: false },
      ],
    },
    {
      category: "General",
      icon: Sparkles,
      tasks: [
        { id: 21, task: "Check all light bulbs", completed: false },
        { id: 22, task: "Wipe down door handles", completed: false },
        { id: 23, task: "Check smoke detector", completed: false },
        { id: 24, task: "Air out the unit", completed: false },
        { id: 25, task: "Final walkthrough inspection", completed: false },
      ],
    },
  ]);

  const toggleTask = (taskId: number) => {
    setChecklist(
      checklist.map((category) => ({
        ...category,
        tasks: category.tasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        ),
      }))
    );
  };

  const totalTasks = checklist.reduce((acc, cat) => acc + cat.tasks.length, 0);
  const completedTasks = checklist.reduce(
    (acc, cat) => acc + cat.tasks.filter((t) => t.completed).length,
    0
  );
  const progress = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Cleaning Checklist</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Complete all tasks for {selectedHaven}
        </p>
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
        {checklist.map((category) => {
          const CategoryIcon = category.icon;
          const categoryCompleted = category.tasks.filter((t) => t.completed).length;
          const categoryTotal = category.tasks.length;
          const categoryProgress = Math.round((categoryCompleted / categoryTotal) * 100);

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
                {category.tasks.map((task) => (
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
        <button className="flex-1 bg-brand-primary hover:bg-brand-primaryDark text-white py-3 rounded-lg font-semibold transition-colors">
          Submit Checklist
        </button>
        <button className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 py-3 rounded-lg font-semibold transition-colors">
          Save Progress
        </button>
      </div>
    </div>
  );
}
