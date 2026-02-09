"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddUnitModal = ({isOpen, onClose}:AddUnitModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // onClose();
    }, 2000);
  };

  return (
    <>
      {/* Backdrop with animation */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in-95 fade-in duration-300">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Add New Unit</h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Unit Name
              </label>
              <input
                type="text"
                placeholder="e.g., Unit 101"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tower Name
              </label>
              <input
                type="text"
                placeholder="e.g., Tower A"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Floor
              </label>
              <input
                type="number"
                placeholder="e.g., 10"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                View Type
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200">
                <option value="" className="dark:bg-gray-800">Select a view</option>
                <option value="city" className="dark:bg-gray-800">City View</option>
                <option value="pool" className="dark:bg-gray-800">Pool View</option>
                <option value="ocean" className="dark:bg-gray-800">Ocean View</option>
                <option value="garden" className="dark:bg-gray-800">Garden View</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Weekday Rate
              </label>
              <input
                type="number"
                placeholder="e.g., 5000"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? "Creating..." : "Create Unit"}
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 fade-in duration-300">
            <div className="w-16 h-16 border-4 border-gray-300 dark:border-gray-600 border-t-orange-500 dark:border-t-orange-400 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-100 font-semibold text-lg">Creating Unit...</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Please wait a moment</p>
          </div>
        </div>
      )}
    </>
  );
};

export default AddUnitModal;
