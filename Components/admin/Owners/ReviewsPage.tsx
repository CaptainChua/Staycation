'use client';

import { useState, useEffect } from "react";
import OwnerPageHeader from "./OwnerPageHeader";
import { Star, ThumbsUp, MessageSquare, TrendingUp } from "lucide-react";

type Review = {
  id: number;
  booking_id: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  comment: string | null;
  cleanliness_rating: number | null;
  communication_rating: number | null;
  checkin_rating: number | null;
  accuracy_rating: number | null;
  location_rating: number | null;
  value_rating: number | null;
  overall_rating: number | null;
  is_verified: boolean;
  is_featured: boolean;
  owner_response: string | null;
  owner_response_at: string | null;
  created_at: string;
  check_in_date: string;
  check_out_date: string;
};

const RatingBreakdown = ({ review }: { review: Review }) => {
  const ratingFields = [
    { label: "Cleanliness", value: review.cleanliness_rating },
    { label: "Communication", value: review.communication_rating },
    { label: "Check-in", value: review.checkin_rating },
    { label: "Accuracy", value: review.accuracy_rating },
    { label: "Location", value: review.location_rating },
    { label: "Value", value: review.value_rating },
  ].filter((r) => r.value !== null);

  if (ratingFields.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2 mb-3">
      {ratingFields.map((field) => (
        <div key={field.label} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{field.label}:</span>
          <span className="font-semibold text-gray-700 dark:text-gray-200">{field.value}/5</span>
        </div>
      ))}
    </div>
  );
};

const RespondSection = ({
  reviewId,
  initialResponse,
  initialResponseAt,
  onResponseSaved,
}: {
  reviewId: number;
  initialResponse: string | null;
  initialResponseAt: string | null;
  onResponseSaved: (reviewId: number, response: string, respondedAt: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (initialResponse) {
    return (
      <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-3 rounded">
        <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
          Your Response
          {initialResponseAt && (
            <span className="ml-2 font-normal text-blue-500 dark:text-blue-400">
              · {new Date(initialResponseAt).toLocaleDateString()}
            </span>
          )}
        </p>
        <p className="text-sm text-blue-800 dark:text-blue-300">{initialResponse}</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!response.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: reviewId, owner_response: response.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to save response");
      onResponseSaved(reviewId, json.data.owner_response, json.data.owner_response_at);
      setOpen(false);
      setResponse("");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-primary border border-brand-primary rounded-lg hover:bg-brand-primary hover:text-white transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Respond to Review
        </button>
      ) : (
        <div className="mt-2 space-y-2">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write your response to this review..."
            rows={3}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
          />
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={!response.trim() || saving}
              className="px-4 py-1.5 text-xs font-medium bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Submit Response"}
            </button>
            <button
              onClick={() => { setOpen(false); setResponse(""); setError(null); }}
              disabled={saving}
              className="px-4 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/reviews");
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const json = await res.json();
        const list: Review[] = Array.isArray(json)
          ? json
          : json?.data || json?.reviews || [];
        setReviews(list);
      } catch (err) {
        console.error(err);
        setError("Failed to load reviews. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleResponseSaved = (reviewId: number, response: string, respondedAt: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, owner_response: response, owner_response_at: respondedAt }
          : r
      )
    );
  };

  const totalReviews = reviews.length;
  const avgOverall =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + Number(r.overall_rating ?? 0), 0) / totalReviews
      : 0;
  const fiveStarCount = reviews.filter((r) => Number(r.overall_rating ?? 0) >= 4.5).length;
  const fiveStarPct = totalReviews > 0 ? Math.round((fiveStarCount / totalReviews) * 100) : 0;
  const verifiedCount = reviews.filter((r) => r.is_verified).length;
  const verifiedPct = totalReviews > 0 ? Math.round((verifiedCount / totalReviews) * 100) : 0;

  const stats = [
    { label: "Average Rating", value: totalReviews > 0 ? avgOverall.toFixed(1) : "—", icon: Star, color: "bg-yellow-500" },
    { label: "Total Reviews", value: totalReviews.toString(), icon: MessageSquare, color: "bg-blue-500" },
    { label: "5-Star Reviews", value: totalReviews > 0 ? `${fiveStarPct}%` : "—", icon: TrendingUp, color: "bg-green-500" },
    { label: "Verified Reviews", value: totalReviews > 0 ? `${verifiedPct}%` : "—", icon: ThumbsUp, color: "bg-indigo-500" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <OwnerPageHeader
        title="Reviews & Feedback"
        description="Monitor and respond to guest reviews"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className={`${stat.color} text-white rounded-lg p-6 shadow hover:shadow-lg transition-all`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <IconComponent className="w-12 h-12 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Reviews List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="p-4 border-b-2 border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Guest Reviews
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({totalReviews} total)
              </span>
            )}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500 dark:text-red-400">{error}</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">No reviews yet.</div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                        {review.guest_first_name} {review.guest_last_name}
                      </h3>
                      {review.is_verified && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      )}
                      {review.is_featured && (
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{review.guest_email}</p>
                  </div>
                  <div className="text-right">
                    {review.overall_rating !== null && (
                      <div className="flex items-center gap-1 mb-1 justify-end">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(Number(review.overall_rating))
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          {Number(review.overall_rating).toFixed(1)}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <RatingBreakdown review={review} />

                {review.comment && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{review.comment}</p>
                )}

                {review.check_in_date && review.check_out_date && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                    Stay: {new Date(review.check_in_date).toLocaleDateString()} —{" "}
                    {new Date(review.check_out_date).toLocaleDateString()}
                  </p>
                )}

                <RespondSection
                  reviewId={review.id}
                  initialResponse={review.owner_response}
                  initialResponseAt={review.owner_response_at}
                  onResponseSaved={handleResponseSaved}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage;