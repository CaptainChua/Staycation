"use client";

import { useMemo, useState } from "react";
import {
  Clock, CheckCircle2, AlertCircle, XCircle, Loader2, Search, Filter, Plus,
  FileText, Upload, ExternalLink, X, ReceiptText
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetAdminPayoutsQuery,
  useGetAdminPayoutQuery,
  useGeneratePayoutMutation,
  useUpdatePayoutMutation,
  type PayoutStatus,
  type AdminPayoutRow,
} from "@/redux/api/adminPayoutsApi";
import { useGetPartnersQuery } from "@/redux/api/partnersApi";
import DocumentsManager from "./Modals/DocumentsManager";

const peso = (n: number) => "₱" + (Number(n) || 0).toLocaleString("en-PH");
const fmtDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "—";

const STATUS_META: Record<PayoutStatus, { label: string; bg: string; text: string; Icon: typeof Clock }> = {
  pending:    { label: "Pending",    bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", Icon: Clock },
  processing: { label: "Processing", bg: "bg-blue-100 dark:bg-blue-900/30",     text: "text-blue-700 dark:text-blue-300",     Icon: Clock },
  paid:       { label: "Paid",       bg: "bg-green-100 dark:bg-green-900/30",   text: "text-green-700 dark:text-green-300",   Icon: CheckCircle2 },
  failed:     { label: "Failed",     bg: "bg-red-100 dark:bg-red-900/30",       text: "text-red-700 dark:text-red-300",       Icon: AlertCircle },
  cancelled:  { label: "Cancelled",  bg: "bg-gray-100 dark:bg-gray-700",        text: "text-gray-600 dark:text-gray-300",     Icon: XCircle },
};

const STATUS_FILTERS: { id: PayoutStatus | "all"; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "paid", label: "Paid" },
  { id: "failed", label: "Failed" },
  { id: "all", label: "All" },
];

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

export default function PayoutsTab() {
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | "all">("pending");
  const [search, setSearch] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [openPayoutId, setOpenPayoutId] = useState<string | null>(null);

  const { data, isLoading, isError } = useGetAdminPayoutsQuery({ status: statusFilter });
  const rows = data?.rows || [];
  const counts = data?.counts || {};

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (p) =>
        p.partner_fullname?.toLowerCase().includes(q) ||
        p.partner_email?.toLowerCase().includes(q) ||
        p.reference_number?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Partner Payouts</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate, schedule, and mark partner payouts as paid. Every booking that funds a
            payout shows up in the line items.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CountBadge label="Pending" value={counts.pending || 0} className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" />
          <CountBadge label="Processing" value={counts.processing || 0} className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" />
          <CountBadge label="Paid" value={counts.paid || 0} className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" />
          <button
            type="button"
            onClick={() => setShowGenerate(true)}
            className="px-3 py-2 rounded-lg bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Record payout
          </button>
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
            placeholder="Search partner / reference"
            aria-label="Search payouts"
            className="bg-transparent border-none outline-none flex-1 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-14 text-center">
          <Loader2 className="w-6 h-6 text-brand-primary animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading payouts…</p>
        </div>
      ) : isError ? (
        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900 rounded-2xl p-8 text-center">
          <p className="text-red-600 font-semibold mb-1">Couldn&apos;t load payouts</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Run the migration in Neon if you haven&apos;t yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-14 text-center">
          <ReceiptText className="w-10 h-10 text-brand-primary mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">
            {statusFilter === "pending" ? "No payouts pending" : "No payouts match"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click <strong>Record payout</strong> to log a direct payment you've sent to a partner.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
          {filtered.map((p) => (
            <PayoutRow key={p.id} payout={p} onOpen={() => setOpenPayoutId(p.id)} />
          ))}
        </div>
      )}

      {showGenerate && <GeneratePayoutModal onClose={() => setShowGenerate(false)} />}
      {openPayoutId && (
        <PayoutDetailModal id={openPayoutId} onClose={() => setOpenPayoutId(null)} />
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

function PayoutRow({ payout, onOpen }: { payout: AdminPayoutRow; onOpen: () => void }) {
  const meta = STATUS_META[payout.status];
  return (
    <div
      className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}
    >
      <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary grid place-items-center flex-shrink-0">
        <ReceiptText className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
          {payout.partner_fullname || payout.partner_email || "—"}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {fmtDate(payout.cycle_start)} → {fmtDate(payout.cycle_end)} · {payout.item_count} booking{payout.item_count === 1 ? "" : "s"}
        </div>
      </div>
      <div className="text-right hidden sm:block">
        <div className="text-[10px] uppercase font-bold text-gray-400">Net</div>
        <div className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-100">
          {peso(Number(payout.net_amount))}
        </div>
      </div>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${meta.bg} ${meta.text}`}>
        <meta.Icon className="w-3 h-3" /> {meta.label}
      </span>
    </div>
  );
}

function GeneratePayoutModal({ onClose }: { onClose: () => void }) {
  // useGetPartnersQuery returns { success, data: Partner[], count } — unwrap to the array
  const { data: partnersResp, isLoading: partnersLoading, error: partnersError } = useGetPartnersQuery();
  const partners = Array.isArray(partnersResp?.data) ? partnersResp.data : [];
  const [partnerId, setPartnerId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const [paymentDestination, setPaymentDestination] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  // Single primary receipt image.
  const [proofFile, setProofFile] = useState<File | null>(null);
  // Additional evidence (multi-file, uploaded after payout creation).
  const [pendingAttachments, setPendingAttachments] = useState<Array<{ label: string; file: File }>>([]);
  const [attachmentLabel, setAttachmentLabel] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [generate, { isLoading }] = useGeneratePayoutMutation();

  // The /api/admin/partners endpoint returns rows with `email` and `fullname`
  // (not partner_email / partner_fullname). Fall back through all the variants
  // so we still get a sensible label whichever shape the backend ever returns.
  const partnerList: Array<{ id: string; label: string }> = (
    partners as Array<{
      id?: string;
      uuid_id?: string;
      email?: string;
      partner_email?: string;
      fullname?: string;
      partner_fullname?: string;
    }>
  )
    .map((p) => {
      const id = String(p.id || p.uuid_id || "");
      const name = p.fullname || p.partner_fullname || "";
      const email = p.email || p.partner_email || "";
      const label = name && email ? `${name} (${email})` : name || email || "Partner";
      return { id, label };
    })
    .filter((p) => p.id);

  const addAttachment = () => {
    if (!attachmentLabel.trim()) {
      toast.error("Add a label for the attachment first");
      return;
    }
    if (!attachmentFile) {
      toast.error("Pick a file to attach");
      return;
    }
    if (attachmentFile.size > 10 * 1024 * 1024) {
      toast.error(`"${attachmentFile.name}" is larger than 10 MB`);
      return;
    }
    setPendingAttachments((prev) => [...prev, { label: attachmentLabel.trim(), file: attachmentFile }]);
    setAttachmentLabel("");
    setAttachmentFile(null);
  };

  const submit = async () => {
    if (!partnerId) return toast.error("Select a partner");
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) return toast.error("Enter a positive amount");
    if (!paymentDate) return toast.error("Pick a payment date");
    try {
      const proofDataUrl = proofFile
        ? await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(proofFile);
          })
        : undefined;
      const created = (await generate({
        partner_id: partnerId,
        amount: amt,
        payment_date: paymentDate,
        payment_method: paymentMethod || undefined,
        payment_destination: paymentDestination || undefined,
        reference_number: referenceNumber || undefined,
        proof_data_url: proofDataUrl,
        notes: notes || undefined,
      }).unwrap()) as { id?: string; data?: { id?: string } } | undefined;
      const newPayoutId =
        (created as { id?: string })?.id || (created as { data?: { id?: string } })?.data?.id || null;

      // Upload any queued evidence files to the freshly-created payout.
      if (newPayoutId && pendingAttachments.length > 0) {
        setUploadingAttachments(true);
        let ok = 0;
        let failed = 0;
        for (const a of pendingAttachments) {
          try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(a.file);
            });
            const r = await fetch(`/api/admin/partner-payouts/${newPayoutId}/attachments`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                label: a.label,
                file_data_url: dataUrl,
                mime_type: a.file.type || null,
                file_size_bytes: a.file.size,
              }),
            });
            if (!r.ok) throw new Error(await r.text().catch(() => ""));
            ok++;
          } catch {
            failed++;
          }
        }
        setUploadingAttachments(false);
        if (failed > 0) {
          toast.success(`Payment recorded. ${ok}/${pendingAttachments.length} attachment(s) uploaded.`);
        } else {
          toast.success(`Payment recorded with ${ok} attachment(s)`);
        }
      } else {
        toast.success("Payment recorded");
      }
      onClose();
    } catch (err) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Failed to record payment";
      toast.error(msg);
    }
  };

  return (
    <ModalShell title="Record payout" onClose={onClose}>
      <div className="space-y-4">
        <Field label={`Partner${partnerList.length ? ` (${partnerList.length} available)` : ""}`}>
          <select
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            disabled={partnersLoading || partnerList.length === 0}
            aria-label="Partner"
            title="Partner"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">
              {partnersLoading
                ? "Loading partners…"
                : partnersError
                  ? "Failed to load partners"
                  : partnerList.length === 0
                    ? "No partners found — create one in Partner Management first"
                    : "Select a partner…"}
            </option>
            {partnerList.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          {partnersError && (
            <p className="text-[11px] text-rose-600 mt-1">
              Could not load partners. Check your session role (Owner needed).
            </p>
          )}
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Amount (₱)">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              aria-label="Amount"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm placeholder:text-gray-400"
            />
          </Field>
          <Field label="Payment date">
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              aria-label="Payment date"
              title="Payment date"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm"
            />
          </Field>
        </div>

        <div className="grid grid-cols-[140px_1fr] gap-3">
          <Field label="Method">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              aria-label="Payment method"
              title="Payment method"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm"
            >
              <option value="gcash">GCash</option>
              <option value="maya">Maya</option>
              <option value="bank">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Destination / account">
            <input
              type="text"
              value={paymentDestination}
              onChange={(e) => setPaymentDestination(e.target.value)}
              placeholder="e.g. 09171234567 or BDO 1234-5678"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm placeholder:text-gray-400"
            />
          </Field>
        </div>

        <Field label="Reference number (optional)">
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="GCash tx ID, bank ref, etc."
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm placeholder:text-gray-400"
          />
        </Field>

        <Field label="Receipt / proof of payment (image, optional)">
          <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-brand-primary/40 bg-brand-primary/5 hover:bg-brand-primary/10 rounded-lg text-brand-primary text-xs font-semibold cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span className="truncate">
              {proofFile ? proofFile.name : "Upload receipt screenshot"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            />
          </label>
        </Field>

        <Field label="Notes (optional)">
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything to record about this transfer"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm resize-none placeholder:text-gray-400"
          />
        </Field>

        {/* Evidence attachments — queued here, uploaded to the new payout after creation. */}
        <div>
          <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            Evidence attachments (optional)
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
            Receipts, screenshots, bank confirmations — anything you want the partner to see on their Cost Breakdown.
            Files upload after the payout is generated.
          </p>
          <div className="space-y-2">
            {pendingAttachments.map((a, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-700">
                <Upload className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{a.label}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {a.file.name} · {(a.file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPendingAttachments((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded p-1"
                  aria-label="Remove attachment"
                  title="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-2 items-stretch">
            <input
              type="text"
              value={attachmentLabel}
              onChange={(e) => setAttachmentLabel(e.target.value)}
              placeholder="Label (e.g. GCash receipt)"
              aria-label="Attachment label"
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm placeholder:text-gray-400"
            />
            <label
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer text-xs font-semibold transition ${
                attachmentFile
                  ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary"
                  : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="truncate max-w-[160px]">
                {attachmentFile ? attachmentFile.name : "Choose file"}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
              />
            </label>
            <button
              type="button"
              onClick={addAttachment}
              disabled={!attachmentLabel.trim() || !attachmentFile}
              className="px-3 rounded-lg border border-brand-primary/40 text-brand-primary hover:bg-brand-primary/5 font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <ModalFooter onClose={onClose}>
        <button
          type="button"
          onClick={submit}
          disabled={isLoading || uploadingAttachments}
          className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold text-sm disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {(isLoading || uploadingAttachments) ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          {uploadingAttachments ? "Uploading files…" : "Record payout"}
        </button>
      </ModalFooter>
    </ModalShell>
  );
}

function PayoutDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = useGetAdminPayoutQuery(id);
  const [update, { isLoading: isUpdating }] = useUpdatePayoutMutation();
  const [reference, setReference] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  if (isLoading || !data) {
    return (
      <ModalShell title="Loading payout…" onClose={onClose}>
        <div className="py-10 text-center text-sm text-gray-500">
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-brand-primary mb-2" />
          Loading
        </div>
      </ModalShell>
    );
  }

  const meta = STATUS_META[data.status];

  const submit = async (action: "mark_processing" | "mark_paid" | "mark_failed" | "cancel") => {
    setPendingAction(action);
    try {
      const proofDataUrl = proofFile ? await fileToDataUrl(proofFile) : undefined;
      await update({
        id,
        action,
        proof_data_url: proofDataUrl,
        reference_number: reference || undefined,
        reviewer_notes: reviewerNotes || undefined,
      }).unwrap();
      toast.success(
        action === "mark_paid" ? "Marked paid" :
        action === "mark_processing" ? "Marked processing" :
        action === "mark_failed" ? "Marked failed" : "Cancelled"
      );
      onClose();
    } catch (err) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Update failed";
      toast.error(msg);
    } finally {
      setPendingAction(null);
    }
  };

  const partnerLabel = data.partner_fullname || data.partner_email || "Unknown partner";

  return (
    <ModalShell title={`Payout · ${partnerLabel}`} onClose={onClose} maxW="max-w-4xl">
      <div className="space-y-4">
        {/* Partner info card — always visible regardless of fullname/email state */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-brand-primary/5 via-transparent to-transparent px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
              Partner
            </div>
            <div className="text-base font-bold text-gray-900 dark:text-white truncate">
              {data.partner_fullname || "—"}
            </div>
            <div className="text-[11.5px] text-gray-500 dark:text-gray-400 truncate">
              {data.partner_email || "no email on file"}
              {data.partner_id ? ` · ID ${data.partner_id.slice(0, 8)}…` : ""}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${meta.bg} ${meta.text}`}>
            <meta.Icon className="w-3 h-3" /> {meta.label}
          </span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase font-semibold text-gray-500">Cycle</div>
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {fmtDate(data.cycle_start)} → {fmtDate(data.cycle_end)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl">
          <SummaryStat label="Gross" value={peso(Number(data.gross_amount))} />
          <SummaryStat label="Commission" value={`− ${peso(Number(data.commission_amount))}`} />
          <SummaryStat label="Deductions" value={`− ${peso(Number(data.deductions_total || 0))}`} />
          <SummaryStat label="Net" value={peso(Number(data.net_amount))} accent />
        </div>

        <div>
          <div className="text-xs uppercase font-semibold text-gray-500 mb-1.5">Bookings ({data.items.length})</div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-[240px] overflow-y-auto">
            <table className="w-full text-[11.5px]">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                <tr>
                  {["Booking", "Haven", "Stay", "Gross", "Net"].map((h, i) => (
                    <th
                      key={h}
                      className={`text-left text-[10px] uppercase tracking-wide font-semibold text-gray-500 px-2 py-1.5 ${
                        [3, 4].includes(i) ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-2 py-1.5 font-mono text-[10.5px] text-gray-500">{it.booking_id}</td>
                    <td className="px-2 py-1.5 text-gray-700 dark:text-gray-200 truncate max-w-[160px]">{it.haven_name}</td>
                    <td className="px-2 py-1.5 text-gray-600 dark:text-gray-300">
                      {fmtDate(it.check_in_date)} → {fmtDate(it.check_out_date)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-gray-700 dark:text-gray-200">{peso(Number(it.gross))}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-semibold text-green-700 dark:text-green-300">
                      {peso(Number(it.partner_share) - Number(it.processing_fee))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Multi-file evidence gallery — receipts, GCash confirmations, etc.
            Moved up here so it's visible above the fold. */}
        <div>
          <div className="text-[11.5px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
            Evidence attachments
          </div>
          <DocumentsManager
            listEndpoint={`/api/admin/partner-payouts/${id}/attachments`}
            deleteUrlBuilder={(d) => `/api/admin/payout-attachments/${d.id}`}
            title="Receipts, screenshots & confirmations"
            subtitle="Attach as many evidence files as you like. Visible to the partner on their Cost Breakdown."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Reference number (e.g. GCash tx ID)">
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={data.reference_number || "—"}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm placeholder:text-gray-400"
            />
          </Field>
          <Field label="Proof of payment (image)">
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-brand-primary/40 bg-brand-primary/5 hover:bg-brand-primary/10 rounded-lg text-brand-primary text-xs font-semibold cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              {proofFile ? proofFile.name : "Upload screenshot"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
            </label>
            {data.proof_of_payment_url && !proofFile && (
              <a
                href={data.proof_of_payment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-brand-primary hover:underline inline-flex items-center gap-1 mt-1"
              >
                <ExternalLink className="w-3 h-3" /> View existing proof
              </a>
            )}
          </Field>
        </div>

        <Field label="Reviewer notes (internal)">
          <textarea
            rows={2}
            value={reviewerNotes}
            onChange={(e) => setReviewerNotes(e.target.value)}
            placeholder={data.reviewer_notes || "Anything for the next reviewer to know"}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm resize-none placeholder:text-gray-400"
          />
        </Field>

      </div>

      <ModalFooter onClose={onClose}>
        <button
          type="button"
          onClick={() => submit("cancel")}
          disabled={isUpdating}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {pendingAction === "cancel" ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
          Cancel payout
        </button>
        {data.status === "pending" && (
          <button
            type="button"
            onClick={() => submit("mark_processing")}
            disabled={isUpdating}
            className="px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {pendingAction === "mark_processing" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
            Mark processing
          </button>
        )}
        <button
          type="button"
          onClick={() => submit("mark_failed")}
          disabled={isUpdating}
          className="px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {pendingAction === "mark_failed" ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertCircle className="w-3 h-3" />}
          Mark failed
        </button>
        <button
          type="button"
          onClick={() => submit("mark_paid")}
          disabled={isUpdating}
          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {pendingAction === "mark_paid" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
          Mark paid
        </button>
      </ModalFooter>
    </ModalShell>
  );
}

// ─── Generic modal scaffolding ──────────────────────────────────────────────
function ModalShell({
  title,
  onClose,
  maxW = "max-w-2xl",
  children,
}: {
  title: string;
  onClose: () => void;
  maxW?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className={`relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full ${maxW} max-h-[90vh] flex flex-col overflow-hidden`}>
        <div className="px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">{title}</h2>
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
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-2 sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold"
      >
        Close
      </button>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase font-bold text-gray-400">{label}</div>
      <div className={`text-sm font-mono font-semibold ${accent ? "text-brand-primary" : "text-gray-800 dark:text-gray-100"}`}>
        {value}
      </div>
    </div>
  );
}
