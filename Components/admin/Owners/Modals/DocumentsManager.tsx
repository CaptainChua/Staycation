"use client";

import { useEffect, useState } from "react";
import { Upload, Trash2, FileText, ExternalLink, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Shared documents-list UI. Used by:
//   - Partner-side onboarding page (caller passes partner endpoints)
//   - Owner-side partner detail pane (caller passes admin endpoints)
//
// The caller controls the two URLs so the component is reusable without
// taking on auth concerns itself.

export interface PartnerDocument {
  id: string;
  label: string;
  file_url: string;
  cloudinary_public_id: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  // Optional — only set on partner_documents rows; payout attachments etc.
  // don't track this and the helper just hides the "Uploaded by..." line.
  uploaded_by?: "partner" | "owner";
  uploaded_at: string;
}

interface DocumentsManagerProps {
  // GET + POST endpoint (returns { success, data: PartnerDocument[] })
  listEndpoint: string;
  // DELETE endpoint, formatted as `${baseDeleteUrl}/${doc.id}`
  deleteUrlBuilder: (doc: PartnerDocument) => string;
  // Friendly section title.
  title?: string;
  subtitle?: string;
  // Caller can hide upload UI for view-only users.
  readOnly?: boolean;
  // Cap so a single partner can't upload thousands of files.
  maxFiles?: number;
  // Cap per file (bytes). Default 10 MB.
  maxFileSizeBytes?: number;
}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const formatBytes = (n: number | null) => {
  if (!n || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocumentsManager({
  listEndpoint,
  deleteUrlBuilder,
  title = "Documents",
  subtitle = "Upload labeled files (IDs, permits, certifications, etc.)",
  readOnly = false,
  maxFiles = 25,
  maxFileSizeBytes = 10 * 1024 * 1024,
}: DocumentsManagerProps) {
  const [docs, setDocs] = useState<PartnerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(listEndpoint, { cache: "no-store" });
      const res = await r.json();
      if (!r.ok || !res?.success) throw new Error(res?.error || `HTTP ${r.status}`);
      setDocs(res.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load documents");
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listEndpoint]);

  const upload = async () => {
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error("Add a label first (e.g. 'Mayor's Permit')");
      return;
    }
    if (!pendingFile) {
      toast.error("Pick a file to upload");
      return;
    }
    if (pendingFile.size > maxFileSizeBytes) {
      toast.error(`File is larger than ${formatBytes(maxFileSizeBytes)}`);
      return;
    }
    if (docs.length >= maxFiles) {
      toast.error(`You've reached the ${maxFiles}-document limit. Remove one first.`);
      return;
    }
    setSubmitting(true);
    try {
      const dataUrl = await fileToDataUrl(pendingFile);
      const r = await fetch(listEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: trimmed,
          file_data_url: dataUrl,
          mime_type: pendingFile.type || null,
          file_size_bytes: pendingFile.size,
        }),
      });
      const res = await r.json();
      if (!r.ok || !res?.success) throw new Error(res?.error || `HTTP ${r.status}`);
      setDocs((prev) => [res.data as PartnerDocument, ...prev]);
      setLabel("");
      setPendingFile(null);
      toast.success(`Uploaded "${trimmed}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (doc: PartnerDocument) => {
    if (!confirm(`Delete document "${doc.label}"? This can't be undone.`)) return;
    setDeletingId(doc.id);
    try {
      const r = await fetch(deleteUrlBuilder(doc), { method: "DELETE" });
      const res = await r.json().catch(() => ({}));
      if (!r.ok || res?.success === false) throw new Error(res?.error || `HTTP ${r.status}`);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success(`Deleted "${doc.label}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-baseline justify-between gap-2">
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white text-sm">{title}</h4>
          {subtitle && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <span className="text-[10.5px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">
          {docs.length}/{maxFiles}
        </span>
      </div>

      {!readOnly && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/60 dark:bg-white/5 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={submitting}
            placeholder="Document label (e.g. Mayor's Permit)"
            className="flex-1 px-3 py-2 text-[13px] border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
          />
          <label
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12.5px] font-semibold rounded-lg border cursor-pointer transition ${
              pendingFile
                ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary"
                : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="truncate max-w-[200px]">
              {pendingFile ? pendingFile.name : "Choose file"}
            </span>
            <input
              type="file"
              className="hidden"
              disabled={submitting}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
              onChange={(e) => setPendingFile(e.target.files?.[0] || null)}
            />
          </label>
          <button
            type="button"
            onClick={upload}
            disabled={submitting || !label.trim() || !pendingFile}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12.5px] font-semibold rounded-lg bg-brand-primary text-white hover:bg-brand-primaryDark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
              </>
            ) : (
              <>Add document</>
            )}
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-6 text-center text-[12.5px] text-gray-500">Loading documents…</div>
      ) : docs.length === 0 ? (
        <div className="p-6 text-center text-[12.5px] text-gray-500">
          {readOnly ? "No documents on file yet." : "No documents uploaded yet."}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-white/5 max-h-[400px] overflow-y-auto">
          {docs.map((d) => (
            <li
              key={d.id}
              className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50/60 dark:hover:bg-white/5"
            >
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                  {d.label}
                </div>
                <div className="text-[10.5px] text-gray-500 truncate">
                  {d.uploaded_by ? (d.uploaded_by === "owner" ? "Uploaded by owner" : "Uploaded by partner") : null}
                  {d.uploaded_by && d.mime_type ? " · " : ""}
                  {d.mime_type ? `${d.mime_type.split("/")[1]?.toUpperCase()}` : ""}
                  {d.file_size_bytes ? ` · ${formatBytes(d.file_size_bytes)}` : ""}
                  {d.uploaded_at
                    ? ` · ${new Date(d.uploaded_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}`
                    : ""}
                </div>
              </div>
              <a
                href={d.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-brand-primary hover:bg-brand-primary/10 transition whitespace-nowrap"
                title="Open file"
              >
                <ExternalLink className="w-3 h-3" /> View
              </a>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => remove(d)}
                  disabled={deletingId === d.id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition disabled:opacity-50"
                  title="Delete"
                >
                  {deletingId === d.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
