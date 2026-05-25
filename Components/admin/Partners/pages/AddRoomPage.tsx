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

            {/* Steps preview — each chip has a hover/tap tooltip with brief guidance. */}
            <StepsPreview />

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

// ─── Steps preview with hover/tap tooltips ──────────────────────────────────
// Each chip explains in 1–2 lines what the partner needs to prepare for that
// step. Tooltip appears on hover (desktop) and on tap (mobile/touch).

interface StepDef {
  label: string;
  tip: string;
}

const STEPS: StepDef[] = [
  { label: "Basic Info", tip: "Room name, tower, floor, view type — the listing's headline." },
  { label: "Pricing", tip: "Hourly + nightly rates and any long-stay discounts you want to offer." },
  { label: "Check-in", tip: "Check-in / check-out time for each rate plan (6h, 10h, weekday, weekend)." },
  { label: "Details", tip: "Capacity, bed setup, room size, cleaning fee, deposit, house rules." },
  { label: "Amenities", tip: "What's included in the room — Wi-Fi, AC, kitchen, TV, parking, etc." },
  { label: "Images", tip: "5+ clear photos for the listing card and gallery (JPG or PNG)." },
  { label: "Photo Tour", tip: "One representative photo per amenity (bed, bath, view, kitchen)." },
  { label: "Video", tip: "Optional YouTube link — embedded on your listing page." },
];

function StepsPreview() {
  const [tappedIdx, setTappedIdx] = useState<number | null>(null);

  // Close the tapped tooltip when the user taps anywhere else.
  useEffect(() => {
    if (tappedIdx === null) return;
    const close = () => setTappedIdx(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [tappedIdx]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
      {STEPS.map((step, i) => (
        <div
          key={step.label}
          className="relative group"
          onClick={(e) => {
            e.stopPropagation();
            setTappedIdx((prev) => (prev === i ? null : i));
          }}
        >
          <button
            type="button"
            aria-describedby={`step-tip-${i}`}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] text-[12.5px] text-[#374151] cursor-help hover:border-brand-primary/40 hover:bg-white transition text-left"
          >
            <span className="w-5 h-5 rounded-full bg-brand-primary/15 text-brand-primary text-[10.5px] font-bold grid place-items-center flex-shrink-0">
              {i + 1}
            </span>
            <span className="truncate">{step.label}</span>
          </button>

          {/* Tooltip: visible on hover (desktop) OR when this chip is tapped (touch). */}
          <div
            id={`step-tip-${i}`}
            role="tooltip"
            className={`pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-30 w-[220px] px-3 py-2 rounded-lg bg-gray-900 text-white text-[11.5px] leading-snug shadow-lg transition-opacity duration-150 ${
              tappedIdx === i
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
            }`}
          >
            {step.tip}
            <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-900" />
          </div>
        </div>
      ))}
    </div>
  );
}
