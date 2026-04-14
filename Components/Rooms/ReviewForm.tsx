"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface ReviewFormProps {
  havenId: string;
  onReviewSubmitted?: () => void;
}

const categories = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "communication", label: "Communication" },
  { key: "checkin", label: "Check-in" },
  { key: "accuracy", label: "Accuracy" },
  { key: "location", label: "Location" },
  { key: "value", label: "Value" },
];

export default function ReviewForm({ havenId, onReviewSubmitted }: ReviewFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [ratings, setRatings] = useState<Record<string, number | null>>(() => {
    const init: Record<string, number | null> = {};
    categories.forEach((c) => (init[c.key] = null));
    return init;
  });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { data: session } = useSession();

  const [bookingLookupEmail, setBookingLookupEmail] = useState("");
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [requiresCompletedBooking, setRequiresCompletedBooking] = useState<null | boolean>(null);

  const charLimit = 1000;

  const setRating = (key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  // If user is logged in, fetch their bookings for this user and prefill completed booking for this haven
  useEffect(() => {
    let cancelled = false;
    const fetchUserBooking = async () => {
      if (!session?.user?.id) return;
      setRequiresCompletedBooking(null);
      try {
        const userId = (session.user as any).id;
        const res = await fetch(`/api/bookings/user/${encodeURIComponent(userId)}`);
        if (!res.ok) {
          setRequiresCompletedBooking(true);
          return;
        }
        const json = await res.json();
        const list = Array.isArray(json) ? json : json?.data || json?.bookings || json?.results || [];
        if (cancelled) return;
        const booking = list.find((b: any) => (b.status === "completed" || b.status === "Completed") && (b.haven_id === havenId || b.havenId === havenId || b.haven_id === undefined));
        if (booking) {
          setBookingId(booking.id || booking.booking_id || "");
          setGuestFirstName(booking.guest_first_name || booking.first_name || "");
          setGuestLastName(booking.guest_last_name || booking.last_name || "");
          setGuestEmail(booking.guest_email || booking.email || "");
          setRequiresCompletedBooking(false);
        } else {
          setRequiresCompletedBooking(true);
        }
      } catch (err) {
        console.error(err);
        setRequiresCompletedBooking(true);
      }
    };
    fetchUserBooking();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, havenId]);

const validate = () => {
  if (session?.user && requiresCompletedBooking === true) {
    toast.error("You need a completed booking to leave a review");
    return false;
  }
  if (session?.user && requiresCompletedBooking === null) {
    toast.error("Still checking your booking, please wait...");
    return false;
  }
  if (!session?.user && !bookingId.trim()) {
    toast.error("Please find your booking using your email first");
    return false;
  }
    const provided = Object.values(ratings).filter((r) => r !== null);
    if (provided.length === 0) {
      toast.error("Please provide at least one rating");
      return false;
    }
    if (comment.length > charLimit) {
      toast.error(`Comment must be at most ${charLimit} characters`);
      return false;
    }
    // For logged-in users require a completed booking prefills
    if (session?.user && requiresCompletedBooking === true) {
      toast.error("You need a completed booking to leave a review");
      return false;
    }
    // For guests ensure booking id resolved
    if (!session?.user && !bookingId) {
      toast.error("Please find a completed booking for your email before submitting");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        booking_id: bookingId,
        haven_id: havenId,
        comment: comment || null,
        guest_first_name: guestFirstName || null,
        guest_last_name: guestLastName || null,
        guest_email: guestEmail || null,
      };
      // attach ratings using the expected keys
      payload.cleanliness_rating = ratings.cleanliness ?? null;
      payload.communication_rating = ratings.communication ?? null;
      payload.checkin_rating = ratings.checkin ?? null;
      payload.accuracy_rating = ratings.accuracy ?? null;
      payload.location_rating = ratings.location ?? null;
      payload.value_rating = ratings.value ?? null;

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Review submitted successfully");
        setExpanded(false);
        setBookingId("");
        setGuestFirstName("");
        setGuestLastName("");
        setGuestEmail("");
        setComment("");
        // reset ratings
        const reset: Record<string, number | null> = {};
        categories.forEach((c) => (reset[c.key] = null));
        setRatings(reset);
        onReviewSubmitted?.();
      } else {
        const msg = data?.error || data?.message || "Failed to submit review";
        toast.error(msg);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setExpanded((s) => !s)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Star className="w-4 h-4 text-yellow-400" />
        {expanded ? "Close review" : "Write a Review"}
      </button>

      {expanded && (
        <form onSubmit={handleSubmit} className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          {/* Booking prefill / email lookup */}
          {session?.user ? (
            <div>
              {requiresCompletedBooking === false ? (
                <p className="text-sm text-green-600 dark:text-green-400">Found completed booking for this haven.</p>
              ) : requiresCompletedBooking === true ? (
                <p className="text-sm text-red-600 dark:text-red-400">You need a completed booking to leave a review</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Checking your bookings...</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
              <div className="flex gap-2">
                <input
                  value={bookingLookupEmail}
                  onChange={(e) => setBookingLookupEmail(e.target.value)}
                  placeholder="Enter your email to find booking"
                  className="flex-1 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={async () => {
                    setLookupMessage(null);
                    setBookingId("");
                    setGuestFirstName("");
                    setGuestLastName("");
                    setGuestEmail("");
                    if (!bookingLookupEmail.trim()) {
                      setLookupMessage("Please enter an email");
                      return;
                    }
                    try {
                      const res = await fetch(`/api/bookings?email=${encodeURIComponent(
                        bookingLookupEmail,
                      )}&haven_id=${encodeURIComponent(havenId)}&status=completed`);
                      if (!res.ok) {
                        setLookupMessage("No completed booking found for this email");
                        return;
                      }
                      const json = await res.json();
                      // Support both array response or { bookings: [...] }
                      const list = Array.isArray(json) ? json : json?.data || json?.bookings || json?.results || [];
                      if (list.length === 0) {
                        setLookupMessage("No completed booking found for this email");
                        return;
                      }
                      const booking = list[0];
                      setBookingId(booking.id || booking.booking_id || "");
                      setGuestFirstName(booking.guest_first_name || booking.first_name || "");
                      setGuestLastName(booking.guest_last_name || booking.last_name || "");
                      setGuestEmail(booking.guest_email || booking.email || bookingLookupEmail);
                      setLookupMessage("Found booking and prefilled details");
                    } catch (err) {
                      console.error(err);
                      setLookupMessage("No completed booking found for this email");
                    }
                  }}
                  className="px-4 py-2 rounded-md bg-brand-primary hover:bg-brand-primaryDark text-white text-sm"
                >
                  Find
                </button>
              </div>
              {lookupMessage && <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{lookupMessage}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((c) => (
              <div key={c.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{c.label}</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(c.key, n)}
                      className={`p-1 rounded-md transition-colors ${((ratings[c.key] ?? 0) >= n) ? "bg-yellow-400/20 text-yellow-400" : "bg-transparent text-gray-400 dark:text-gray-500 hover:text-yellow-400"}`}
                      aria-label={`${c.label} ${n} star`}
                    >
                      <Star className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, charLimit))}
              rows={5}
              placeholder="Share your experience (optional)"
              className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{comment.length}/{charLimit} characters</p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="px-3 py-2 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-md bg-brand-primary hover:bg-brand-primaryDark text-white text-sm font-medium disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
