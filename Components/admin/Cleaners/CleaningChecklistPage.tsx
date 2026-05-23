"use client";

import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Camera,
  ImagePlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  BedDouble,
  Bath,
  ChefHat,
  Sofa,
  Sparkles,
  Home,
  User,
  CalendarCheck,
  Loader2,
  ZoomIn,
} from "lucide-react";
import { useTranslations, type Lang } from "./translations";

/* ==============================
 * Types
 * ============================== */
type Photo = {
  id: string;
  url: string;
  category: string;
  created_at?: string;
};

type RoomState = {
  category: string;
  photos: Photo[];
  isUploading: boolean;
};

type Haven = {
  id: string;
  name: string;
  address?: string;
  bookingId?: string;
  guestName?: string;
  checkOutDate?: string;
  isUpcoming?: boolean;
};

interface Props {
  initialHavenId?: string | null;
  lang?: Lang;
}

/* ==============================
 * Constants
 * ============================== */
const CATEGORIES = ["Bedroom", "Bathroom", "Kitchen", "Living Room", "General"];

const ICON_MAP: Record<string, React.ElementType> = {
  Bedroom: BedDouble,
  Bathroom: Bath,
  Kitchen: ChefHat,
  "Living Room": Sofa,
  General: Sparkles,
};

/* ==============================
 * Main Component
 * ============================== */
export default function CleaningChecklistPage({ initialHavenId, lang = "en" }: Props = {}) {
  const t = useTranslations(lang);

  const [haven, setHaven] = useState<Haven | null>(null);
  const [rooms, setRooms] = useState<RoomState[]>(
    CATEGORIES.map((cat) => ({ category: cat, photos: [], isUploading: false }))
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  /* ---- Fetch haven info ---- */
  useEffect(() => {
    if (!initialHavenId) return;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/cleaners/havens?include_id=${encodeURIComponent(initialHavenId)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          const found = data.find(
            (h: Haven) => String(h.id) === String(initialHavenId)
          );
          if (found) setHaven(found);
        }
      } catch (err) {
        console.error("Failed to fetch haven info", err);
      }
    })();
  }, [initialHavenId]);

  /* ---- Fetch existing photos ---- */
  const fetchPhotos = useCallback(async (havenId: string) => {
    setIsPageLoading(true);
    try {
      const res = await fetch(
        `/api/admin/cleaners?haven_id=${encodeURIComponent(havenId)}`,
        { cache: "no-store" }
      );
      const payload = await res.json();

      if (res.ok && payload.success && payload.data) {
        const { session, photos } = payload.data as {
          session?: { id: string };
          photos?: Photo[];
        };

        if (session?.id) setSessionId(session.id);

        const byCategory: Record<string, Photo[]> = {};
        (photos ?? []).forEach((p) => {
          if (!byCategory[p.category]) byCategory[p.category] = [];
          byCategory[p.category].push(p);
        });

        setRooms(
          CATEGORIES.map((cat) => ({
            category: cat,
            photos: byCategory[cat] ?? [],
            isUploading: false,
          }))
        );
      } else {
        throw new Error(payload.error ?? "Failed to load photos");
      }
    } catch (err) {
      console.error("fetchPhotos error:", err);
      toast.error("Failed to load existing photos");
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialHavenId) fetchPhotos(initialHavenId);
  }, [initialHavenId, fetchPhotos]);

  /* ---- Upload handler ---- */
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: string
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !initialHavenId) return;

    e.target.value = "";

    setRooms((prev) =>
      prev.map((r) =>
        r.category === category ? { ...r, isUploading: true } : r
      )
    );

    try {
      const uploaded: Photo[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("haven_id", initialHavenId);
        formData.append("category", category);
        formData.append("photo", file);
        if (sessionId) formData.append("session_id", sessionId);

        const res = await fetch("/api/admin/cleaners/photos", {
          method: "POST",
          body: formData,
        });
        const payload = await res.json();

        if (!res.ok || !payload.success) {
          throw new Error(payload.error ?? "Upload failed");
        }

        if (payload.data?.session_id && !sessionId) {
          setSessionId(payload.data.session_id);
        }

        uploaded.push(payload.data.photo as Photo);
      }

      setRooms((prev) =>
        prev.map((r) =>
          r.category === category
            ? { ...r, photos: [...r.photos, ...uploaded], isUploading: false }
            : r
        )
      );

      toast.success(
        uploaded.length === 1 ? "Photo uploaded" : `${uploaded.length} photos uploaded`
      );
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
      setRooms((prev) =>
        prev.map((r) =>
          r.category === category ? { ...r, isUploading: false } : r
        )
      );
    }
  };

  /* ---- Delete photo ---- */
  const deletePhoto = async (photoId: string, category: string) => {
    try {
      const res = await fetch(
        `/api/admin/cleaners/photos?photo_id=${encodeURIComponent(photoId)}`,
        { method: "DELETE" }
      );
      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to delete photo");
      }

      setRooms((prev) =>
        prev.map((r) =>
          r.category === category
            ? { ...r, photos: r.photos.filter((p) => p.id !== photoId) }
            : r
        )
      );
      toast.success("Photo removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove photo");
    }
  };

  /* ---- Submit cleaning session ---- */
  const handleSubmit = async () => {
    if (!sessionId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/cleaners/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", session_id: sessionId }),
      });
      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to submit");
      }
      toast.success("Cleaning submitted successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- Derived stats ---- */
  const roomsWithPhotos = rooms.filter((r) => r.photos.length > 0).length;
  const totalRooms = rooms.length;
  const progress =
    totalRooms === 0 ? 0 : Math.round((roomsWithPhotos / totalRooms) * 100);
  const canSubmit = roomsWithPhotos === totalRooms;

  /* ==============================
   * "No task selected" empty state
   * ============================== */
  if (!initialHavenId && !isPageLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {t.checklistTitle}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t.checklistSubtitle}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
            <AlertCircle className="w-12 h-12 text-blue-500 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {t.noTaskSelected}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            {t.noTaskMsg}{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-200">{t.noTaskDesc1}</span>{" "}
            {t.noTaskMsg2}{" "}
            <span className="font-semibold text-brand-primary">{t.noTaskDesc2}</span>{" "}
            {t.noTaskMsg3}
          </p>
        </div>
      </div>
    );
  }

  /* ==============================
   * Main render
   * ============================== */
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
          {t.checklistTitle}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t.checklistSubtitle}
        </p>
      </div>

      {/* Booking Info Card */}
      {haven && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 border-l-4 border-brand-primary">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Home className="w-4 h-4 text-brand-primary" />
              <span className="font-medium">{haven.name}</span>
              {haven.address && (
                <span className="text-gray-400 dark:text-gray-500">
                  ({haven.address})
                </span>
              )}
            </div>
            {haven.guestName && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4" />
                <span>{t.guest} {haven.guestName}</span>
              </div>
            )}
            {haven.checkOutDate && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <CalendarCheck className="w-4 h-4" />
                <span>{t.checkedOut} {haven.checkOutDate}</span>
              </div>
            )}
            {haven.bookingId && (
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {t.bookingHash}{haven.bookingId}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming notice */}
      {haven?.isUpcoming && (
        <div className="flex items-start gap-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-300 dark:border-sky-700 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">{t.upcomingTitle}</p>
            <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
              {t.upcomingMsg(haven.checkOutDate ?? "")}
            </p>
          </div>
        </div>
      )}

      {/* Progress Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {t.overallProgress}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-brand-primary text-base">
                {roomsWithPhotos}/{totalRooms}
              </span>{" "}
              {t.tasksCompleted}
            </p>
          </div>
          <p className="text-3xl font-bold text-brand-primary">{progress}%</p>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              progress === 100 ? "bg-green-500" : "bg-brand-primary"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Room cards */}
      <div className="space-y-4">
        {rooms.map((room) => {
          const RoomIcon = ICON_MAP[room.category] ?? Sparkles;
          const isLocked = !!haven?.isUpcoming;

          return (
            <div
              key={room.category}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-primary text-white p-3 rounded-lg">
                    <RoomIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                      {room.category}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {room.photos.length} photo{room.photos.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {room.photos.length > 0 && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>

              {/* Photo grid */}
              {room.photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                  {room.photos.map((photo) => (
                    <div key={photo.id} className="relative group aspect-square">
                      <img
                        src={photo.url}
                        alt={`${room.category} photo`}
                        className="w-full h-full object-cover rounded-lg cursor-pointer"
                        onClick={() => setLightboxUrl(photo.url)}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <button
                          type="button"
                          aria-label="View photo"
                          onClick={() => setLightboxUrl(photo.url)}
                          className="p-1.5 bg-white/90 rounded-full"
                        >
                          <ZoomIn className="w-3.5 h-3.5 text-gray-800" />
                        </button>
                        {!isLocked && (
                          <button
                            type="button"
                            aria-label="Delete photo"
                            onClick={() => deletePhoto(photo.id, room.category)}
                            className="p-1.5 bg-red-500 rounded-full"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload / camera buttons */}
              {!isLocked && (
                <div className="flex gap-2">
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed
                      transition-colors text-sm font-medium select-none
                      ${
                        room.isUploading
                          ? "border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary"
                      }`}
                  >
                    {room.isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <span>Camera</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      disabled={room.isUploading}
                      onChange={(e) => handleFileChange(e, room.category)}
                    />
                  </label>

                  <label
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed
                      transition-colors text-sm font-medium select-none
                      ${
                        room.isUploading
                          ? "border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary"
                      }`}
                  >
                    {room.isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImagePlus className="w-4 h-4" />
                    )}
                    <span>Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={room.isUploading}
                      onChange={(e) => handleFileChange(e, room.category)}
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action / Status */}
      {!haven?.isUpcoming && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 text-center sm:text-left">
            {canSubmit ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                {t.allDone}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.autoSave} &nbsp;·&nbsp;{" "}
                <span className="font-semibold text-brand-primary">
                  {totalRooms - roomsWithPhotos} room{totalRooms - roomsWithPhotos !== 1 ? "s" : ""} remaining
                </span>
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={!canSubmit || !sessionId || isSubmitting}
            onClick={handleSubmit}
            className={`w-full sm:w-auto font-semibold rounded-lg px-6 py-2.5 transition-colors flex items-center justify-center gap-2 ${
              canSubmit && sessionId
                ? "bg-brand-primary text-white hover:bg-brand-primary/90"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {t.confirmFinish}
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            aria-label="Close lightbox"
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"
            onClick={() => setLightboxUrl(null)}
          >
            ✕
          </button>
          <img
            src={lightboxUrl}
            alt="Full size preview"
            className="max-w-full max-h-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}