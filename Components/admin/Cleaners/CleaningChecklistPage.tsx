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
  X,
} from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslations, type Lang } from "./translations";

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
  /** Passed from MySchedulePage when "Start Cleaning" is clicked */
  initialHavenId?: string | null;
  lang?: Lang;
}

export default function CleaningChecklistPage({ initialHavenId, lang = "en" }: Props = {}) {
  const t = useTranslations(lang);
  const [havens, setHavens] = useState<Haven[]>([]);
  const [selectedHavenId, setSelectedHavenId] = useState<string | null>(null);
  const [isHavensLoading, setIsHavensLoading] = useState<boolean>(false);
  const [selectedHaven, setSelectedHaven] = useState<Haven | null>(null);

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

/* ==============================
 * Main Component
 * ============================== */
export default function CleaningPhotoPage({ initialHavenId }: Props = {}) {
  const [haven, setHaven] = useState<Haven | null>(null);
  const [rooms, setRooms] = useState<RoomState[]>(
    CATEGORIES.map((cat) => ({ category: cat, photos: [], isUploading: false }))
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** URL of photo open in lightbox (null = closed) */
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

        // Group photos by category
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

    // Reset input so the same file can be picked again if needed
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

        // Capture newly created session id if first upload
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
      toast.error(
        err instanceof Error ? err.message : "Failed to upload photo"
      );
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
      toast.error(
        err instanceof Error ? err.message : "Failed to remove photo"
      );
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
      toast.error(
        err instanceof Error ? err.message : "Failed to submit"
      );
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
                <span>{t.guest} {selectedHaven.guestName}</span>
              </div>
            )}
            {selectedHaven.checkOutDate && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <CalendarCheck className="w-4 h-4" />
                <span>{t.checkedOut} {selectedHaven.checkOutDate}</span>
              </div>
            )}
            {selectedHaven.bookingId && (
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {t.bookingHash}{selectedHaven.bookingId}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming notice */}
      {selectedHaven?.isUpcoming && (
        <div className="flex items-start gap-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-300 dark:border-sky-700 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">{t.upcomingTitle}</p>
            <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
              {t.upcomingMsg(selectedHaven.checkOutDate ?? "")}
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
                {completedTasks}/{totalTasks}
              </span>{" "}
              {t.tasksCompleted}
            </p>
          </div>
          <div className="text-right">
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

        {/* ---- Room cards ---- */}
        <div className="space-y-4">
          {isPageLoading
            ? /* Skeleton */
              CATEGORIES.map((cat) => (
                <div
                  key={cat}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton
                      className="w-11 h-11 rounded-lg"
                      label="Loading room icon"
                    />
                    <div>
                      <Skeleton
                        className="h-4 w-28 rounded mb-1"
                        label="Loading room name"
                      />
                      <Skeleton
                        className="h-3 w-20 rounded"
                        label="Loading room status"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((j) => (
                      <Skeleton
                        key={j}
                        className="aspect-square rounded-lg"
                        label="Loading photo"
                      />
                    ))}
                  </div>
                </div>
              ))
            : /* Actual rooms */
              rooms.map((room) => {
                const RoomIcon = ICON_MAP[room.category] ?? Sparkles;
                const isDone = room.photos.length > 0;
                const isLocked = !!haven?.isUpcoming;

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
                        {t.ofCompleted(categoryCompleted, categoryTotal)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-brand-primary">
                    {categoryProgress}%
                  </span>
                </div>

                    {/* Photo grid */}
                    {room.photos.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                        {room.photos.map((photo) => (
                          <div
                            key={photo.id}
                            className="relative group aspect-square"
                          >
                            <img
                              src={photo.url}
                              alt={`${room.category} photo`}
                              className="w-full h-full object-cover rounded-lg cursor-pointer"
                              onClick={() => setLightboxUrl(photo.url)}
                            />
                            {/* Hover overlay */}
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
                                  onClick={() =>
                                    deletePhoto(photo.id, room.category)
                                  }
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
                        {/* ---- Take Photo (opens camera directly on mobile) ---- */}
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
                            onChange={(e) =>
                              handleFileChange(e, room.category)
                            }
                          />
                        </label>

                        {/* ---- Choose from Gallery ---- */}
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
                            onChange={(e) =>
                              handleFileChange(e, room.category)
                            }
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
        </div>

      {/* Action / Status */}
      {!selectedHaven?.isUpcoming && !isLoading && checklist.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 text-center sm:text-left">
            {canComplete ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                {t.allDone}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.autoSave} &nbsp;·&nbsp;{" "}
                <span className="font-semibold text-brand-primary">
                  {totalTasks - completedTasks} task{totalTasks - completedTasks !== 1 ? "s" : ""} remaining
                </span>
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={!canComplete || !checklistId}
            onClick={async () => {
              try {
                const res = await fetch("/api/admin/cleaners", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "submit",
                    checklist_id: checklistId,
                  }),
                });
                const payload = await res.json();
                if (!res.ok || !payload?.success) {
                  throw new Error(payload?.error || "Failed to submit checklist");
                }
                toast.success("Checklist submitted successfully");
              } catch (err) {
                console.error("Submit checklist error:", err);
                const message = err instanceof Error ? err.message : String(err);
                toast.error(message || "Failed to submit checklist");
              }
            }}
            className={`w-full sm:w-auto font-semibold rounded-lg px-6 py-2.5 transition-colors flex items-center justify-center gap-2 ${
              canComplete
                ? "bg-brand-primary text-white hover:bg-brand-primary/90"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {t.confirmFinish}
          </button>
        </div>
      )}
    </div>
  );
}