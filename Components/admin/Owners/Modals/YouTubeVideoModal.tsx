"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@nextui-org/input";
import { Youtube, Play, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import toast from 'react-hot-toast';
import SubModalWrapper from "./SubModalWrapper";

interface YouTubeVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  initialUrl?: string;
  isAddMode?: boolean;
  mode?: 'modal' | 'step';
  onNext?: () => void;
  onBack?: () => void;
  isLastStep?: boolean;
}

const YouTubeVideoModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialUrl, 
  isAddMode = false,
  mode = 'modal',
  onNext,
  onBack,
  isLastStep = false
}: YouTubeVideoModalProps) => {
  const [youtubeUrl, setYoutubeUrl] = useState("");

  useEffect(() => {
    if (initialUrl) {
      setYoutubeUrl(initialUrl);
    }
  }, [initialUrl, isOpen]);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = useMemo(() => getYoutubeId(youtubeUrl), [youtubeUrl]);
  const isValid = useMemo(() => youtubeUrl === "" || !!videoId, [youtubeUrl, videoId]);

  const handleChange = (val: string) => {
    setYoutubeUrl(val);
    onSave(val); // Update parent in real-time
  };

  const handleSave = () => {
    if (!isValid) {
      toast.error("Please enter a valid YouTube URL or leave it empty");
      return;
    }
    onSave(youtubeUrl);
    if (mode === 'step' && onNext) {
      onNext();
    } else {
      toast.success("Video URL updated!");
      onClose();
    }
  };

  const inputContent = (
    <div className="space-y-8 max-w-3xl mx-auto py-4">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.01] hover:shadow-md will-change-transform">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-red-50 p-3 rounded-2xl">
            <Youtube className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Featured Video</h2>
            <p className="text-sm text-gray-500">Add a virtual tour or promotional video</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            type="url"
            label="YouTube Video Link"
            labelPlacement="outside"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => handleChange(e.target.value)}
            startContent={<Play className="w-4 h-4 text-gray-400" />}
            isInvalid={!isValid && youtubeUrl !== ""}
            errorMessage={!isValid && youtubeUrl !== "" ? "Invalid YouTube URL format" : null}
            classNames={{
              label: "text-xs font-bold text-gray-400 uppercase tracking-widest mb-2",
              inputWrapper: `bg-gray-50 border-2 transition-all h-14 rounded-2xl ${isValid ? 'focus-within:!border-brand-primary' : 'border-red-200'}`
            }}
          />
          
          <p className="text-[10px] text-gray-400 flex items-center gap-1.5 px-1">
            <Info className="w-3 h-3" />
            Paste the full URL from your browser's address bar.
          </p>
        </div>
      </div>

      {/* Video Preview */}
      {videoId ? (
        <div className="animate-in zoom-in-95 duration-300">
          <div className="group relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <div className="absolute top-4 right-4 bg-brand-primary text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-green-600 bg-green-50 py-3 rounded-2xl border border-green-100">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-bold">Video Link Validated</span>
          </div>
        </div>
      ) : youtubeUrl !== "" && !isValid ? (
        <div className="p-12 text-center bg-red-50 rounded-3xl border-2 border-dashed border-red-100">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 font-bold">Unable to resolve video</p>
          <p className="text-xs text-red-400 mt-1">Please check the URL and try again</p>
        </div>
      ) : (
        <div className="p-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 opacity-60">
          <Play className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Video preview will appear here</p>
        </div>
      )}
    </div>
  );

  if (mode === 'step') return inputContent;

  return (
    <SubModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Property Video"
      subtitle="Enhance your listing with a video tour"
      onSave={handleSave}
      maxWidth="max-w-4xl"
      mode={mode}
      onBack={onBack}
      saveLabel={mode === 'step' ? (isLastStep ? "Finish & Publish" : "Next") : "Save Changes"}
      backLabel={mode === 'step' ? "Back" : "Cancel"}
    >
      {inputContent}
    </SubModalWrapper>
  );
};

const Info = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
  </svg>
);

export default YouTubeVideoModal;