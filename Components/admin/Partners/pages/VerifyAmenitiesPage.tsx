"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2, Clock, AlertCircle, RotateCcw, Upload, X, Image as ImageIcon,
  Video, Loader2, FileText, Home
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetMyAmenityVerificationsQuery,
  useUpdateMyAmenityVerificationMutation,
  type AmenityVerification,
  type AmenityVerificationStatus,
} from "@/redux/api/amenityVerificationApi";
import { useGetMyListingsQuery } from "@/redux/api/partnerSelfApi";

const fontFraunces = "font-[var(--font-fraunces),Georgia,serif]";

const STATUS_META: Record<AmenityVerificationStatus, { label: string; bg: string; text: string; Icon: typeof Clock }> = {
  pending:             { label: "Pending review",   bg: "bg-[#fef3c7]", text: "text-[#92400e]", Icon: Clock },
  verified:            { label: "Verified",         bg: "bg-[#dcfce7]", text: "text-[#16a34a]", Icon: CheckCircle2 },
  rejected:            { label: "Rejected",         bg: "bg-[#fee2e2]", text: "text-[#dc2626]", Icon: AlertCircle },
  revision_requested:  { label: "Needs revision",   bg: "bg-[#dbeafe]", text: "text-[#2563eb]", Icon: RotateCcw },
};

// Convert a File to a data URL (matches the upload contract on the backend)
const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

export default function VerifyAmenitiesPage() {
  const { data: listings = [] } = useGetMyListingsQuery();
  const [selectedHavenId, setSelectedHavenId] = useState<string>("");

  // Default to the first listing once they load
  const havenIdToUse = selectedHavenId || listings[0]?.uuid_id || "";

  const { data: verifications = [], isLoading, isError } = useGetMyAmenityVerificationsQuery(
    havenIdToUse ? { havenId: havenIdToUse } : undefined,
    { skip: !havenIdToUse && listings.length === 0 }
  );

  const grouped = useMemo(() => {
    const byStatus: Record<string, AmenityVerification[]> = {
      revision_requested: [],
      rejected: [],
      pending: [],
      verified: [],
    };
    verifications.forEach((v) => {
      byStatus[v.status].push(v);
    });
    return byStatus;
  }, [verifications]);

  if (listings.length === 0) {
    return (
      <div className="animate-in fade-in duration-500">
        <PageHeader />
        <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-12 text-center">
          <Home className="w-10 h-10 text-[#B8860B] mx-auto mb-3" />
          <p className="text-[15px] font-semibold text-[#111827] mb-1">No listings yet</p>
          <p className="text-[13px] text-[#6B7280]">
            Add a room first — once it has amenities, you can submit proof for each one here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader />

      {/* Haven picker */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-4 mb-5">
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#6B7280] mb-2">
          Choose listing
        </div>
        <div className="flex flex-wrap gap-2">
          {listings.map((l) => {
            const isActive = (selectedHavenId || listings[0]?.uuid_id) === l.uuid_id;
            return (
              <button
                key={l.uuid_id}
                type="button"
                onClick={() => setSelectedHavenId(l.uuid_id)}
                className={`px-3.5 py-1.5 rounded-[9px] text-[12.5px] font-semibold border transition ${
                  isActive
                    ? "border-[#B8860B] bg-[#FEF3C7] text-[#B8860B]"
                    : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
                }`}
              >
                {l.haven_name}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-12 text-center">
          <Loader2 className="w-6 h-6 text-[#B8860B] animate-spin mx-auto mb-2" />
          <p className="text-[13px] text-[#6B7280]">Loading verifications…</p>
        </div>
      ) : isError ? (
        <div className="bg-white border border-[#fecaca] rounded-[14px] p-8 text-center">
          <p className="text-[#dc2626] font-semibold mb-1">Couldn&apos;t load verifications</p>
          <p className="text-[#6B7280] text-[13px]">Please refresh and try again.</p>
        </div>
      ) : verifications.length === 0 ? (
        <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-[#B8860B] mx-auto mb-3" />
          <p className="text-[15px] font-semibold text-[#111827] mb-1">No amenities to verify</p>
          <p className="text-[13px] text-[#6B7280] max-w-[420px] mx-auto">
            This listing has no selected amenities. Add some from the Edit Haven → Amenities step.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(["revision_requested", "rejected", "pending", "verified"] as const).map((status) => {
            const items = grouped[status];
            if (items.length === 0) return null;
            const meta = STATUS_META[status];
            return (
              <section key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <meta.Icon className={`w-4 h-4 ${meta.text}`} />
                  <h2 className={`text-[15px] font-medium text-[#111827] ${fontFraunces}`}>
                    {meta.label}
                  </h2>
                  <span className="text-[11.5px] text-[#6B7280]">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {items.map((v) => (
                    <AmenityCard key={v.id} verification={v} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-6">
      <div className="text-[11.5px] text-[#6B7280] uppercase tracking-[0.1em] mb-2 font-semibold">
        Trust & verification
      </div>
      <h1 className={`text-[32px] leading-[1.15] tracking-[-0.02em] text-[#111827] mb-1.5 font-medium ${fontFraunces}`}>
        Verify amenities
      </h1>
      <p className="text-[14.5px] text-[#6B7280] max-w-[640px]">
        Upload a photo, video, or screenshot for each amenity you offer. Once verified by our team,
        it shows up on your public listing. Guests trust listings with verified amenities.
      </p>
    </div>
  );
}

function AmenityCard({ verification: v }: { verification: AmenityVerification }) {
  const [notes, setNotes] = useState(v.notes || "");
  const [uploading, setUploading] = useState(false);
  const [updateVerification] = useUpdateMyAmenityVerificationMutation();

  const meta = STATUS_META[v.status];

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const tooBig = Array.from(files).find((f) => f.size > 25 * 1024 * 1024);
    if (tooBig) {
      toast.error(`${tooBig.name} is over 25MB`);
      return;
    }
    setUploading(true);
    try {
      const new_media = await Promise.all(
        Array.from(files).map(async (file) => ({
          data: await fileToDataUrl(file),
          type: file.type.startsWith("video") ? ("video" as const) : ("image" as const),
        }))
      );
      await updateVerification({ id: v.id, new_media }).unwrap();
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`);
    } catch (err) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveMedia = async (url: string) => {
    try {
      await updateVerification({ id: v.id, remove_urls: [url] }).unwrap();
      toast.success("Removed");
    } catch {
      toast.error("Could not remove");
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateVerification({ id: v.id, notes }).unwrap();
      toast.success("Notes saved");
    } catch {
      toast.error("Could not save notes");
    }
  };

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {v.amenity_icon_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.amenity_icon_url} alt="" className="w-10 h-10 rounded-lg bg-[#FEF3C7] p-1.5 object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] text-[#B8860B] grid place-items-center">
              <FileText className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-[#111827] truncate">{v.amenity_label}</div>
            <div className="text-[10.5px] uppercase tracking-wide text-[#6B7280] font-semibold">
              {v.category}
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${meta.bg} ${meta.text}`}>
          <meta.Icon className="w-3 h-3" />
          {meta.label}
        </span>
      </div>

      {/* Reviewer feedback (for rejected / revision) */}
      {(v.status === "rejected" || v.status === "revision_requested") && v.rejection_reason && (
        <div className={`p-3 rounded-lg text-[12.5px] ${
          v.status === "rejected"
            ? "bg-[#fee2e2] text-[#7f1d1d]"
            : "bg-[#dbeafe] text-[#1e3a8a]"
        }`}>
          <div className="font-semibold mb-0.5">
            {v.status === "rejected" ? "Why this was rejected" : "What needs revision"}
          </div>
          <div className="leading-relaxed">{v.rejection_reason}</div>
        </div>
      )}

      {/* Media gallery */}
      <div>
        <div className="text-[11px] uppercase tracking-wide font-semibold text-[#6B7280] mb-2">
          Proof ({v.media.length})
        </div>
        {v.media.length === 0 ? (
          <div className="text-[12.5px] text-[#6B7280] italic mb-2">
            No proof uploaded yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {v.media.map((m) => (
              <div key={m.url} className="relative aspect-square rounded-lg overflow-hidden bg-[#f9fafb] border border-[#e5e7eb] group">
                {m.type === "video" ? (
                  <video src={m.url} className="w-full h-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                )}
                <span className="absolute top-1.5 left-1.5 bg-black/60 text-white rounded px-1 py-0.5 text-[9.5px] uppercase">
                  {m.type === "video" ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(m.url)}
                  aria-label="Remove proof"
                  title="Remove proof"
                  className="absolute top-1.5 right-1.5 bg-white/95 text-red-500 hover:bg-red-500 hover:text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className={`flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-[12px] font-semibold border-2 border-dashed cursor-pointer transition ${
          uploading
            ? "border-[#B8860B] bg-[#FEF3C7] text-[#B8860B] cursor-wait"
            : "border-[#B8860B]/40 bg-[#FEF3C7]/40 text-[#B8860B] hover:bg-[#FEF3C7]"
        }`}>
          {uploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" /> Upload photo / video / screenshot
            </>
          )}
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            disabled={uploading}
            onChange={(e) => {
              handleUpload(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
        </label>
      </div>

      {/* Notes */}
      <div>
        <div className="text-[11px] uppercase tracking-wide font-semibold text-[#6B7280] mb-1.5">
          Notes for our team (optional)
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={(e) => {
            if (e.target.value !== (v.notes || "")) handleSaveNotes();
          }}
          rows={2}
          placeholder="Anything our reviewer should know about this amenity"
          className="w-full px-3 py-2 border border-[#d1d5db] bg-white text-[#111827] rounded-lg outline-none focus:border-[#B8860B] text-[12.5px] resize-none placeholder:text-[#9CA3AF]"
        />
      </div>
    </div>
  );
}
