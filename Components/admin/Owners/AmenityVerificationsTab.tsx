"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2, Clock, AlertCircle, RotateCcw, Search, X,
  Image as ImageIcon, Video, Loader2, FileText, Filter
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetAdminAmenityVerificationsQuery,
  useReviewAmenityVerificationMutation,
  type AmenityVerification,
  type AmenityVerificationStatus,
} from "@/redux/api/amenityVerificationApi";

const STATUS_META: Record<AmenityVerificationStatus, { label: string; bg: string; text: string; Icon: typeof Clock }> = {
  pending:             { label: "Pending",        bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", Icon: Clock },
  verified:            { label: "Verified",       bg: "bg-green-100 dark:bg-green-900/30",    text: "text-green-700 dark:text-green-300",   Icon: CheckCircle2 },
  rejected:            { label: "Rejected",       bg: "bg-red-100 dark:bg-red-900/30",        text: "text-red-700 dark:text-red-300",       Icon: AlertCircle },
  revision_requested:  { label: "Needs revision", bg: "bg-blue-100 dark:bg-blue-900/30",      text: "text-blue-700 dark:text-blue-300",     Icon: RotateCcw },
};

const STATUS_FILTERS: { id: "pending" | "verified" | "rejected" | "revision_requested" | "all"; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "revision_requested", label: "Revision" },
  { id: "rejected", label: "Rejected" },
  { id: "verified", label: "Verified" },
  { id: "all", label: "All" },
];

export default function AmenityVerificationsTab() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "verified" | "rejected" | "revision_requested" | "all">("pending");
  const [search, setSearch] = useState("");
  const [reviewing, setReviewing] = useState<AmenityVerification | null>(null);

  const { data, isLoading, isError } = useGetAdminAmenityVerificationsQuery({
    status: statusFilter,
  });
  const verifications = data?.data || [];
  const counts = data?.counts || {};

  const filtered = useMemo(() => {
    if (!search.trim()) return verifications;
    const q = search.toLowerCase();
    return verifications.filter(
      (v) =>
        v.amenity_label.toLowerCase().includes(q) ||
        v.haven_name?.toLowerCase().includes(q) ||
        v.partner_fullname?.toLowerCase().includes(q) ||
        v.partner_email?.toLowerCase().includes(q)
    );
  }, [search, verifications]);

  return (
    <div className="space-y-5">
      {/* Header + counts */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Amenity Verifications</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Review partner-submitted proof for each amenity before it goes public.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CountBadge label="Pending" value={counts.pending || 0} className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" />
          <CountBadge label="Revision" value={counts.revision_requested || 0} className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" />
          <CountBadge label="Rejected" value={counts.rejected || 0} className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" />
          <CountBadge label="Verified" value={counts.verified || 0} className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">Status</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                statusFilter === f.id
                  ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="md:ml-auto flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 w-full md:w-[280px]">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search amenity / haven / partner"
            aria-label="Search amenity verifications"
            className="bg-transparent border-none outline-none flex-1 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-14 text-center">
          <Loader2 className="w-6 h-6 text-brand-primary animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading verifications…</p>
        </div>
      ) : isError ? (
        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900 rounded-2xl p-8 text-center">
          <p className="text-red-600 font-semibold mb-1">Couldn&apos;t load verifications</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Run the migration in Neon if you haven&apos;t yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-14 text-center">
          <CheckCircle2 className="w-10 h-10 text-brand-primary mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">
            {statusFilter === "pending" ? "Nothing pending review" : "No verifications match"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {statusFilter === "pending"
              ? "All amenities have been reviewed. Check back when partners submit new ones."
              : "Try a different status filter or clear the search."}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((v) => (
              <VerifRow key={v.id} v={v} onReview={() => setReviewing(v)} />
            ))}
          </div>
        </div>
      )}

      {reviewing && (
        <ReviewModal
          verification={reviewing}
          onClose={() => setReviewing(null)}
        />
      )}
    </div>
  );
}

function CountBadge({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${className}`}>
      <span>{value}</span>
      <span className="opacity-80 font-semibold">{label}</span>
    </div>
  );
}

function VerifRow({ v, onReview }: { v: AmenityVerification; onReview: () => void }) {
  const meta = STATUS_META[v.status];
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
      <div className="w-12 h-12 rounded-xl bg-brand-primary/10 grid place-items-center flex-shrink-0 overflow-hidden">
        {v.amenity_icon_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.amenity_icon_url} alt="" className="w-8 h-8 object-contain" />
        ) : (
          <FileText className="w-6 h-6 text-brand-primary" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{v.amenity_label}</span>
          <span className="text-[10.5px] uppercase tracking-wide font-semibold text-gray-400">
            {v.category}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {v.haven_name} · {v.partner_fullname || v.partner_email || "Partner"}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <ImageIcon className="w-3.5 h-3.5" /> {v.media.length} proof
      </div>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${meta.bg} ${meta.text}`}>
        <meta.Icon className="w-3 h-3" />
        {meta.label}
      </span>
      <button
        type="button"
        onClick={onReview}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary hover:bg-brand-primaryDark text-white transition"
      >
        Review
      </button>
    </div>
  );
}

function ReviewModal({ verification: v, onClose }: { verification: AmenityVerification; onClose: () => void }) {
  const [reviewerNotes, setReviewerNotes] = useState(v.reviewer_notes || "");
  const [rejectionReason, setRejectionReason] = useState(v.rejection_reason || "");
  const [reverifyAt, setReverifyAt] = useState(v.reverify_at?.slice(0, 10) || "");
  const [pendingAction, setPendingAction] = useState<null | "verify" | "reject" | "request_revision">(null);
  const [reviewVerification, { isLoading: isReviewing }] = useReviewAmenityVerificationMutation();

  const meta = STATUS_META[v.status];

  const submit = async (action: "verify" | "reject" | "request_revision") => {
    if (action !== "verify" && !rejectionReason.trim()) {
      toast.error("Please tell the partner why (rejection reason is required)");
      return;
    }
    setPendingAction(action);
    try {
      await reviewVerification({
        id: v.id,
        action,
        reviewer_notes: reviewerNotes || undefined,
        rejection_reason: action !== "verify" ? rejectionReason : undefined,
        reverify_at: reverifyAt ? new Date(reverifyAt).toISOString() : undefined,
      }).unwrap();
      toast.success(
        action === "verify" ? "Verified" : action === "reject" ? "Rejected" : "Revision requested"
      );
      onClose();
    } catch (err) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Review failed";
      toast.error(msg);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 grid place-items-center flex-shrink-0 overflow-hidden">
              {v.amenity_icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.amenity_icon_url} alt="" className="w-8 h-8 object-contain" />
              ) : (
                <FileText className="w-6 h-6 text-brand-primary" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-0.5">
                {v.category} amenity
              </div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{v.amenity_label}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {v.haven_name} · {v.partner_fullname || v.partner_email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.bg} ${meta.text}`}>
              <meta.Icon className="w-3 h-3" /> {meta.label}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              title="Close"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Partner notes */}
          {v.notes && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Partner notes
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{v.notes}</p>
            </div>
          )}

          {/* Media */}
          <div>
            <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Proof ({v.media.length})
            </div>
            {v.media.length === 0 ? (
              <div className="p-6 text-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm text-yellow-800 dark:text-yellow-300">
                <AlertCircle className="w-5 h-5 mx-auto mb-1.5" />
                Partner hasn&apos;t uploaded any proof yet. Consider <strong>requesting revision</strong>.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {v.media.map((m) => (
                  <a
                    key={m.url}
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 group block"
                  >
                    {m.type === "video" ? (
                      <video src={m.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <Image src={m.url} alt="" fill className="object-cover" sizes="180px" />
                    )}
                    <span className="absolute top-2 left-2 bg-black/70 text-white rounded px-1.5 py-0.5 text-[10px] uppercase font-semibold inline-flex items-center gap-1">
                      {m.type === "video" ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                      {m.type}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Reviewer notes (internal) */}
          <div>
            <label htmlFor="reviewer-notes" className="block text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Internal reviewer notes (not shown to partner)
            </label>
            <textarea
              id="reviewer-notes"
              rows={2}
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="Anything for the next reviewer to know"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm resize-none placeholder:text-gray-400"
            />
          </div>

          {/* Rejection reason (shown to partner on reject/revision) */}
          <div>
            <label htmlFor="rejection-reason" className="block text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Reason (required to reject or request revision — shown to partner)
            </label>
            <textarea
              id="rejection-reason"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. The photo doesn't clearly show the amenity. Please upload a clearer shot."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm resize-none placeholder:text-gray-400"
            />
          </div>

          {/* Reverify schedule */}
          <div>
            <label htmlFor="reverify-at" className="block text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Reverification date (optional)
            </label>
            <input
              id="reverify-at"
              type="date"
              value={reverifyAt}
              onChange={(e) => setReverifyAt(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm"
            />
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 italic">
              When set, the amenity is flagged for re-review on this date.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-2 sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-sm"
          >
            Close
          </button>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => submit("request_revision")}
              disabled={isReviewing}
              className="px-4 py-2 rounded-lg border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold text-sm disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              {pendingAction === "request_revision" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Request revision
            </button>
            <button
              type="button"
              onClick={() => submit("reject")}
              disabled={isReviewing}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              {pendingAction === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
              Reject
            </button>
            <button
              type="button"
              onClick={() => submit("verify")}
              disabled={isReviewing}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              {pendingAction === "verify" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
