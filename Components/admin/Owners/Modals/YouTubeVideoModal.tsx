"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Input } from "@nextui-org/input";
import toast from 'react-hot-toast';

interface YouTubeVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  initialUrl?: string;
}

const YouTubeVideoModal = ({ isOpen, onClose, onSave, initialUrl }: YouTubeVideoModalProps) => {
  const [youtubeUrl, setYoutubeUrl] = useState("");

  useEffect(() => {
    if (initialUrl) {
      setYoutubeUrl(initialUrl);
    }
  }, [initialUrl, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(youtubeUrl);
    toast.success("YouTube video URL saved successfully!");
    onClose();
  };

  const handleClose = () => {
    setYoutubeUrl("");
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={handleClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">YouTube Video</h2>
              <p className="text-sm text-gray-600 mt-1">Add or update YouTube video URL for this haven</p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <Input
                type="url"
                label="YouTube URL (optional)"
                labelPlacement="outside"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                classNames={{ label: "text-sm font-medium text-gray-700" }}
              />
              {youtubeUrl && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <div className="aspect-video bg-gray-200 rounded flex items-center justify-center">
                    <p className="text-sm text-gray-500">Video preview will appear here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default YouTubeVideoModal;
