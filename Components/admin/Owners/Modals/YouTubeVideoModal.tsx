"use client";

import { useState, useEffect } from "react";
import { Input } from "@nextui-org/input";
import toast from 'react-hot-toast';
import SubModalWrapper from "./SubModalWrapper";

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

  const handleSave = () => {
    onSave(youtubeUrl);
    toast.success("YouTube video URL saved successfully!");
    handleClose();
  };

  const handleClose = () => {
    setYoutubeUrl("");
    onClose();
  };

  return (
    <SubModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title="YouTube Video"
      subtitle="Add or update YouTube video URL for this haven"
      onSave={handleSave}
    >
      <div className="space-y-4">
        <Input
          type="url"
          label="YouTube URL (optional)"
          labelPlacement="outside"
          placeholder="https://www.youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          classNames={{ 
            label: "text-sm font-medium text-gray-700",
            inputWrapper: "border-gray-300 focus-within:!border-brand-primary focus-within:!ring-brand-primary/20 hover:border-brand-primary/50 transition-colors"
          }}
        />
        {youtubeUrl && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2 font-medium">Preview:</p>
            <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
              {/* Basic iframe embed logic could go here, for now placeholder */}
              <p className="text-sm text-gray-500">Video preview will appear here</p>
            </div>
          </div>
        )}
      </div>
    </SubModalWrapper>
  );
};

export default YouTubeVideoModal;