"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2, Clock, AlertCircle, XCircle, Loader2, Search, Filter,
  Mail, Phone, MapPin, Building2, Banknote, CreditCard, FileText, ExternalLink, X, RotateCcw, ShieldOff
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetPartnerApprovalsQuery,
  useReviewPartnerMutation,
  type AdminPartnerRow,
  type PartnerStatus,
} from "@/redux/api/partnerRegistrationApi";

const STATUS_META: Record<PartnerStatus, { label: string; bg: string; text: string; Icon: typeof Clock }> = {
  pending:   { label: "Pending",     bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", Icon: Clock },
  active:    { label: "Approved",    bg: "bg-green-100 dark:bg-green-900/30",    text: "text-green-700 dark:text-green-300",   Icon: CheckCircle2 },
  suspended: { label: "Suspended",   bg: "bg-red-100 dark:bg-red-900/30",        text: "text-red-700 dark:text-red-300",       Icon: ShieldOff },
  rejected:  { label: "Rejected",    bg: "bg-red-100 dark:bg-red-900/30",        text: "text-red-700 dark:text-red-300",       Icon: XCircle },
  inactive:  { label: "Inactive",    bg: "bg-gray-100 dark:bg-gray-700",         text: "text-gray-600 dark:text-gray-300",     Icon: X },
};

const STATUS_FILTERS: { id: PartnerStatus | "all"; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "active", label: "Approved" },
  { id: "suspended", label: "Suspended" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

export default function PartnerApprovalsTab() {
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | "all">("pending");
  const [search, setSearch] = useState("");
  const [reviewing, setReviewing] = useState<AdminPartnerRow | null>(null);

  const { data, isLoading, isError } = useGetPartnerApprovalsQuery({ status: statusFilter });
  const rows = data?.rows || [];
  const counts = data?.counts || {};

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (p) =>
        p.partner_fullname?.toLowerCase().includes(q) ||
        p.partner_email?.toLowerCase().includes(q) ||
        p.business_name?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Partner Approvals</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Review partner applications, verify their documents, and approve or reject.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CountBadge label="Pending" value={counts.pending || 0} className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" />
          <CountBadge label="Approved" value={counts.active || 0} className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" />
          <CountBadge label="Suspended" value={counts.suspended || 0} className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" />
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
            placeholder="Search name / email / business"
            aria-label="Search partners"
            className="bg-transparent border-none outline-none flex-1 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-14 text-center">
          <Loader2 className="w-6 h-6 text-brand-primary animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading partners…</p>
        </div>
      ) : isError ? (
        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900 rounded-2xl p-8 text-center">
          <p className="text-red-600 font-semibold mb-1">Couldn&apos;t load partners</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Run the migration in Neon if you haven&apos;t yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-14 text-center">
          <CheckCircle2 className="w-10 h-10 text-brand-primary mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">
            {statusFilter === "pending" ? "No applications pending" : "No partners match"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
          {filtered.map((p) => (
            <PartnerRow key={p.id} partner={p} onReview={() => setReviewing(p)} />
          ))}
        </div>
      )}

      {reviewing && (
        <ReviewModal partner={reviewing} onClose={() => setReviewing(null)} />
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

function PartnerRow({ partner: p, onReview }: { partner: AdminPartnerRow; onReview: () => void }) {
  const meta = STATUS_META[p.status];
  const docsComplete = !!p.valid_id_url && !!p.contract_url && !!(p.gcash_number || p.maya_number || p.bank_account_number);
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
      <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary grid place-items-center flex-shrink-0 overflow-hidden">
        {p.profile_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.profile_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <Building2 className="w-5 h-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
          {p.partner_fullname || p.partner_email || "—"}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-2 flex-wrap">
          <span>{p.partner_email}</span>
          {p.business_name && <span>· {p.business_name}</span>}
          <span>· Registered {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}</span>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2 text-[10.5px] font-semibold">
        <DocDot ok={!!p.valid_id_url} label="ID" />
        <DocDot ok={!!p.contract_url} label="Contract" />
        <DocDot ok={!!(p.gcash_number || p.maya_number || p.bank_account_number)} label="Payout" />
        {docsComplete && (
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#16a34a]">ready</span>
        )}
      </div>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${meta.bg} ${meta.text}`}>
        <meta.Icon className="w-3 h-3" /> {meta.label}
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

function DocDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] ${
        ok
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
      }`}
      title={`${label} ${ok ? "uploaded" : "missing"}`}
    >
      {ok ? <CheckCircle2 className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
      {label}
    </span>
  );
}

function ReviewModal({ partner: p, onClose }: { partner: AdminPartnerRow; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [pendingAction, setPendingAction] = useState<null | "approve" | "reject" | "suspend" | "reactivate">(null);
  const [reviewPartner, { isLoading }] = useReviewPartnerMutation();

  const meta = STATUS_META[p.status];

  const submit = async (action: "approve" | "reject" | "suspend" | "reactivate") => {
    if ((action === "reject" || action === "suspend") && !reason.trim()) {
      toast.error("A reason is required");
      return;
    }
    setPendingAction(action);
    try {
      await reviewPartner({ id: p.id, action, reason: reason || undefined }).unwrap();
      toast.success(
        action === "approve" ? "Partner approved" :
        action === "reject" ? "Application rejected" :
        action === "suspend" ? "Partner suspended" : "Partner reactivated"
      );
      onClose();
    } catch (err) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Failed";
      toast.error(msg);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 grid place-items-center flex-shrink-0 overflow-hidden">
              {p.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.profile_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-6 h-6 text-brand-primary" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-0.5">
                Partner application · {new Date(p.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
              </div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{p.partner_fullname || "—"}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{p.partner_email}</p>
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
          {/* Profile */}
          <Section title="Profile" icon={Building2}>
            <Detail label="Business name" value={p.business_name} />
            <Detail label="Phone" value={p.partner_phone} icon={Phone} />
            <Detail label="Email" value={p.partner_email} icon={Mail} />
            <Detail label="Address" value={[p.partner_address, p.partner_city, p.partner_province, p.partner_postal_code].filter(Boolean).join(", ")} icon={MapPin} />
            <Detail label="Existing havens" value={p.havens_count > 0 ? `${p.havens_count} listing${p.havens_count > 1 ? "s" : ""}` : "None yet"} />
          </Section>

          {/* Documents */}
          <Section title="Documents" icon={FileText}>
            <DocCard label={`Valid ID${p.valid_id_type ? ` · ${p.valid_id_type}` : ""}`} url={p.valid_id_url} />
            <DocCard label={`Signed contract${p.contract_signed_at ? ` · ${new Date(p.contract_signed_at).toLocaleDateString()}` : ""}`} url={p.contract_url} />
          </Section>

          {/* Payout */}
          <Section title="Payout details" icon={Banknote}>
            <PayoutCard
              label="GCash"
              destination={p.gcash_number}
              holder={p.gcash_holder_name}
            />
            <PayoutCard
              label="Maya"
              destination={p.maya_number}
              holder={p.maya_holder_name}
            />
            <PayoutCard
              label={p.bank_name || "Bank transfer"}
              destination={p.bank_account_number}
              holder={p.bank_account_name}
            />
          </Section>

          {/* Tax */}
          {(p.tax_id || p.tax_registered_name) && (
            <Section title="Tax info" icon={CreditCard}>
              <Detail label="TIN / VAT ID" value={p.tax_id} />
              <Detail label="Registered name" value={p.tax_registered_name} />
            </Section>
          )}

          {/* Existing reason (if applicable) */}
          {p.status === "rejected" && p.rejection_reason && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
              <div className="text-xs uppercase font-bold text-red-700 dark:text-red-300 mb-1">Previous rejection reason</div>
              <p className="text-sm text-red-700 dark:text-red-300">{p.rejection_reason}</p>
            </div>
          )}
          {p.status === "suspended" && p.suspension_reason && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
              <div className="text-xs uppercase font-bold text-red-700 dark:text-red-300 mb-1">Suspension reason</div>
              <p className="text-sm text-red-700 dark:text-red-300">{p.suspension_reason}</p>
            </div>
          )}

          {/* Reason input for reject/suspend */}
          <div>
            <label htmlFor="review-reason" className="block text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Reason (required when rejecting or suspending — shown to the partner)
            </label>
            <textarea
              id="review-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. The ID image is too blurry to read. Please re-upload a clearer photo."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm resize-none placeholder:text-gray-400"
            />
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
            {p.status === "active" && (
              <button
                type="button"
                onClick={() => submit("suspend")}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {pendingAction === "suspend" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
                Suspend
              </button>
            )}
            {p.status === "suspended" && (
              <button
                type="button"
                onClick={() => submit("reactivate")}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg border border-green-300 text-green-600 hover:bg-green-50 font-semibold text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {pendingAction === "reactivate" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Reactivate
              </button>
            )}
            {(p.status === "pending" || p.status === "rejected") && (
              <>
                <button
                  type="button"
                  onClick={() => submit("reject")}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  {pendingAction === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => submit("approve")}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  {pendingAction === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Approve
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Building2; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-brand-primary" />
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Detail({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: typeof Mail }) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
      <div className="text-[10.5px] uppercase font-semibold text-gray-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{value || "—"}</div>
    </div>
  );
}

function DocCard({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg flex items-center justify-between gap-3">
      <div>
        <div className="text-[10.5px] uppercase font-semibold text-gray-500 mb-0.5">{label}</div>
        <div className={`text-sm font-semibold ${url ? "text-[#16a34a]" : "text-red-600"}`}>
          {url ? "Uploaded" : "Missing"}
        </div>
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 text-xs font-semibold inline-flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" /> View
        </a>
      )}
    </div>
  );
}

function PayoutCard({ label, destination, holder }: { label: string; destination: string | null; holder: string | null }) {
  const filled = !!destination;
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
      <div className="text-[10.5px] uppercase font-semibold text-gray-500 mb-0.5">{label}</div>
      <div className={`text-sm font-semibold ${filled ? "text-gray-800 dark:text-gray-100" : "text-gray-400"}`}>
        {filled ? destination : "Not added"}
      </div>
      {holder && <div className="text-[11px] text-gray-500 mt-0.5">{holder}</div>}
    </div>
  );
}
