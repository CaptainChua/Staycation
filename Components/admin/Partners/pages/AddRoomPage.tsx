"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowLeft, Sparkles } from "lucide-react";
import HavenFormModal from "@/Components/admin/Owners/Modals/HavenFormModal";

const fontFraunces = "font-[var(--font-fraunces),Georgia,serif]";

interface AddRoomPageProps {
  onNavigate: (page: string) => void;
}

export default function AddRoomPage({ onNavigate }: AddRoomPageProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Force light mode while wizard is open (partner area is light-themed)
  useEffect(() => {
    if (!isWizardOpen) return;
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    if (wasDark) html.classList.remove("dark");
    return () => {
      if (wasDark) html.classList.add("dark");
    };
  }, [isWizardOpen]);

  const handleClose = () => {
    setIsWizardOpen(false);
    onNavigate("listings");
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* PAGE HEADER */}
      <div className="flex items-end justify-between gap-6 mb-6 flex-wrap">
        <div>
          <div className="text-[11.5px] text-[#6B7280] uppercase tracking-[0.1em] mb-2 font-semibold">
            Listings
          </div>
          <h1 className={`text-[32px] leading-[1.15] tracking-[-0.02em] text-[#111827] mb-1.5 font-medium ${fontFraunces}`}>
            Add a new room
          </h1>
          <p className="text-[14.5px] text-[#6B7280] max-w-[560px]">
            Tell us about your space. Submissions are reviewed by the Staycation Haven PH team — usually within 24–48 hours.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          className="px-4 py-2 rounded-[9px] text-[13.5px] font-semibold flex items-center gap-2 text-[#374151] hover:bg-[#f9fafb] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </button>
      </div>

      {/* INTRO CARD */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-8 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-start">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary grid place-items-center flex-shrink-0">
            <Plus className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-[22px] leading-[1.2] mb-2 text-[#111827] font-medium ${fontFraunces}`}>
              Ready to list a new room?
            </h2>
            <p className="text-[14.5px] text-[#374151] mb-6 max-w-[600px] leading-relaxed">
              We&apos;ll guide you through 8 quick steps — basic info, pricing, check-in,
              details, amenities, images, photo tour, and an optional YouTube video.
              You can save and come back anytime.
            </p>

            {/* Steps preview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {[
                "Basic Info",
                "Pricing",
                "Check-in",
                "Details",
                "Amenities",
                "Images",
                "Photo Tour",
                "Video",
              ].map((step, i) => (
                <div
                  key={step}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] text-[12.5px] text-[#374151]"
                >
                  <span className="w-5 h-5 rounded-full bg-brand-primary/15 text-brand-primary text-[10.5px] font-bold grid place-items-center">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                className="px-5 py-2.5 rounded-[9px] text-[13.5px] font-semibold flex items-center gap-2 bg-brand-primary hover:bg-brand-primaryDark text-white transition active:translate-y-[0.5px] shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add a Room
              </button>
              <button
                type="button"
                onClick={() => onNavigate("listings")}
                className="px-5 py-2.5 rounded-[9px] text-[13.5px] font-semibold flex items-center gap-2 bg-white border border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb] transition"
              >
                View my rooms
              </button>
            </div>
          </div>
        </div>

        {/* Tip card */}
        <div className="mt-7 p-4 rounded-[11px] bg-[#FEF3C7] border border-[#DAA520]/30 flex gap-3">
          <Sparkles className="w-4 h-4 text-[#92400e] flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-[#374151]">
            <strong className="text-[#92400e]">Tip:</strong> Rooms with 5+ photos and a clear
            description get approved <strong>2× faster</strong> and book sooner.
          </p>
        </div>
      </div>

      {/* WIZARD MODAL */}
      <HavenFormModal isOpen={isWizardOpen} onClose={handleClose} initialData={null} />
    </div>
  );
}
