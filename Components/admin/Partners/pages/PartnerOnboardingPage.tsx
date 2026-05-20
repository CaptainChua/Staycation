"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, Clock, AlertCircle, Upload, FileText, Building2,
  CreditCard, Banknote, Receipt, Loader2, ExternalLink, X
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetMyRegistrationQuery,
  useUpdateMyRegistrationMutation,
  type PartnerStatus,
} from "@/redux/api/partnerRegistrationApi";

const fontFraunces = "font-[var(--font-fraunces),Georgia,serif]";

const STATUS_META: Record<PartnerStatus, { label: string; bg: string; text: string; Icon: typeof Clock; helper: string }> = {
  pending:   { label: "Awaiting approval",       bg: "bg-[#fef3c7]", text: "text-[#92400e]", Icon: Clock, helper: "Finish the checklist below — your application moves to review once everything is uploaded." },
  active:    { label: "Approved",                bg: "bg-[#dcfce7]", text: "text-[#16a34a]", Icon: CheckCircle2, helper: "You're approved! You can list rooms, receive bookings, and earn payouts." },
  suspended: { label: "Suspended",               bg: "bg-[#fee2e2]", text: "text-[#dc2626]", Icon: AlertCircle, helper: "Your account is suspended. Reach out to support to resolve this." },
  rejected:  { label: "Application rejected",    bg: "bg-[#fee2e2]", text: "text-[#dc2626]", Icon: AlertCircle, helper: "Your application was rejected. The reason is shown below — contact support if you'd like to appeal." },
  inactive:  { label: "Inactive",                bg: "bg-[#f3f4f6]", text: "text-[#6B7280]", Icon: X, helper: "Account closed." },
};

const ID_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "driver_license", label: "Driver's License" },
  { value: "national_id", label: "National ID (PhilSys)" },
  { value: "umid", label: "UMID" },
  { value: "philhealth", label: "PhilHealth ID" },
  { value: "sss", label: "SSS ID" },
  { value: "postal", label: "Postal ID" },
  { value: "other", label: "Other government-issued ID" },
];

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error(`${file.name} is over 8MB`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

export default function PartnerOnboardingPage() {
  const { data: reg, isLoading } = useGetMyRegistrationQuery();
  const [update, { isLoading: isSaving }] = useUpdateMyRegistrationMutation();

  // Local edit state for unsaved fields (defaults from server when reg loads)
  const [form, setForm] = useState({
    business_name: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    valid_id_type: "",
    gcash_number: "",
    gcash_holder_name: "",
    maya_number: "",
    maya_holder_name: "",
    bank_name: "",
    bank_account_name: "",
    bank_account_number: "",
    tax_id: "",
    tax_registered_name: "",
  });

  useEffect(() => {
    if (!reg) return;
    setForm({
      business_name: reg.business_name || "",
      phone: reg.partner_phone || "",
      address: reg.partner_address || "",
      city: reg.partner_city || "",
      province: reg.partner_province || "",
      postal_code: reg.partner_postal_code || "",
      valid_id_type: reg.valid_id_type || "",
      gcash_number: reg.gcash_number || "",
      gcash_holder_name: reg.gcash_holder_name || "",
      maya_number: reg.maya_number || "",
      maya_holder_name: reg.maya_holder_name || "",
      bank_name: reg.bank_name || "",
      bank_account_name: reg.bank_account_name || "",
      bank_account_number: reg.bank_account_number || "",
      tax_id: reg.tax_id || "",
      tax_registered_name: reg.tax_registered_name || "",
    });
  }, [reg]);

  const meta = useMemo(() => STATUS_META[(reg?.status as PartnerStatus) || "pending"], [reg?.status]);

  const saveText = async () => {
    try {
      await update({
        business_name: form.business_name || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        province: form.province || undefined,
        postal_code: form.postal_code || undefined,
        valid_id_type: form.valid_id_type || undefined,
        gcash_number: form.gcash_number || undefined,
        gcash_holder_name: form.gcash_holder_name || undefined,
        maya_number: form.maya_number || undefined,
        maya_holder_name: form.maya_holder_name || undefined,
        bank_name: form.bank_name || undefined,
        bank_account_name: form.bank_account_name || undefined,
        bank_account_number: form.bank_account_number || undefined,
        tax_id: form.tax_id || undefined,
        tax_registered_name: form.tax_registered_name || undefined,
      }).unwrap();
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    }
  };

  const uploadValidId = async (file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      await update({ valid_id_data_url: dataUrl, valid_id_type: form.valid_id_type || undefined }).unwrap();
      toast.success("ID uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const uploadContract = async (file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      await update({ contract_data_url: dataUrl }).unwrap();
      toast.success("Contract uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  if (isLoading || !reg) {
    return (
      <div className="animate-in fade-in duration-500 py-20 text-center">
        <Loader2 className="w-6 h-6 text-[#B8860B] animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page header */}
      <div className="mb-6">
        <div className="text-[11.5px] text-[#6B7280] uppercase tracking-[0.1em] mb-2 font-semibold">
          Account
        </div>
        <h1 className={`text-[32px] leading-[1.15] tracking-[-0.02em] text-[#111827] mb-1.5 font-medium ${fontFraunces}`}>
          Partner onboarding
        </h1>
        <p className="text-[14.5px] text-[#6B7280] max-w-[640px]">
          Complete the checklist so our team can review and approve your account. You can update
          any of this later from your profile.
        </p>
      </div>

      {/* Status banner */}
      <div
        className={`rounded-[14px] border p-5 mb-6 ${meta.bg} ${
          reg.status === "rejected" || reg.status === "suspended"
            ? "border-[#dc2626]/30"
            : reg.status === "active"
            ? "border-[#16a34a]/30"
            : "border-[#92400e]/30"
        }`}
      >
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white ${meta.text}`}>
            <meta.Icon className="w-5 h-5" />
          </span>
          <div>
            <div className={`text-[15px] font-bold ${meta.text}`}>{meta.label}</div>
            <p className={`text-[13px] leading-relaxed ${meta.text} opacity-90 mt-0.5`}>{meta.helper}</p>
            {(reg.status === "rejected" && reg.rejection_reason) && (
              <div className="mt-2 p-3 bg-white/60 rounded-lg">
                <div className="text-[10.5px] uppercase font-semibold text-[#dc2626] mb-0.5">Reason</div>
                <p className="text-[12.5px] text-[#374151]">{reg.rejection_reason}</p>
              </div>
            )}
            {(reg.status === "suspended" && reg.suspension_reason) && (
              <div className="mt-2 p-3 bg-white/60 rounded-lg">
                <div className="text-[10.5px] uppercase font-semibold text-[#dc2626] mb-0.5">Reason</div>
                <p className="text-[12.5px] text-[#374151]">{reg.suspension_reason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-5 mb-6">
        <h3 className={`text-[15px] font-medium text-[#111827] mb-3 ${fontFraunces}`}>Checklist</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <ChecklistCard label="Basic info" done={reg.checklist.basic_info} />
          <ChecklistCard label="Address" done={reg.checklist.address} />
          <ChecklistCard label="Valid ID" done={reg.checklist.valid_id} />
          <ChecklistCard label="Contract" done={reg.checklist.contract} />
          <ChecklistCard label="Payout" done={reg.checklist.payout} />
        </div>
      </div>

      {/* Profile details */}
      <Section title="Business & contact" icon={Building2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Business name (optional)">
            <Input value={form.business_name} onChange={(v) => setForm((p) => ({ ...p, business_name: v }))} placeholder="e.g. Casa Verde Staycation" />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} placeholder="+63 917 000 0000" />
          </Field>
        </div>
        <Field label="Street address">
          <Input value={form.address} onChange={(v) => setForm((p) => ({ ...p, address: v }))} placeholder="Unit 12-F, M Place South Triangle" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="City">
            <Input value={form.city} onChange={(v) => setForm((p) => ({ ...p, city: v }))} placeholder="Quezon City" />
          </Field>
          <Field label="Province">
            <Input value={form.province} onChange={(v) => setForm((p) => ({ ...p, province: v }))} placeholder="Metro Manila" />
          </Field>
          <Field label="Postal code">
            <Input value={form.postal_code} onChange={(v) => setForm((p) => ({ ...p, postal_code: v }))} placeholder="1103" />
          </Field>
        </div>
      </Section>

      {/* Valid ID */}
      <Section title="Valid ID" icon={FileText} required>
        <p className="text-[12.5px] text-[#6B7280] mb-3">
          Upload a clear photo or scan of a government-issued ID. We use this to verify your
          identity — it&apos;s never shown publicly.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3">
          <Field label="ID type">
            <select
              value={form.valid_id_type}
              onChange={(e) => setForm((p) => ({ ...p, valid_id_type: e.target.value }))}
              aria-label="ID type"
              title="ID type"
              className="w-full px-3 py-2.5 border-2 border-[#e5e7eb] bg-white text-[#111827] rounded-xl outline-none focus:border-[#B8860B] text-[14px]"
            >
              <option value="">Select an ID type…</option>
              {ID_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="ID image">
            <UploadBlock
              hasFile={!!reg.valid_id_url}
              previewUrl={reg.valid_id_url}
              onUpload={uploadValidId}
              placeholder="Upload your ID (JPG / PNG / PDF up to 8MB)"
              accept="image/*,application/pdf"
            />
          </Field>
        </div>
      </Section>

      {/* Contract */}
      <Section title="Partner contract" icon={Receipt} required>
        <p className="text-[12.5px] text-[#6B7280] mb-3">
          Download the partner agreement, sign it, and re-upload here. By signing you agree to
          our partner terms (commission, payout schedule, content rules).
        </p>
        <a
          href="/docs/partner-contract.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#B8860B] hover:underline mb-3"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Download blank contract
        </a>
        <UploadBlock
          hasFile={!!reg.contract_url}
          previewUrl={reg.contract_url}
          onUpload={uploadContract}
          placeholder="Upload your signed contract (PDF preferred, JPG/PNG OK, up to 8MB)"
          accept="image/*,application/pdf"
        />
        {reg.contract_signed_at && (
          <p className="text-[11px] text-[#6B7280] mt-1.5 italic">
            Last signed: {new Date(reg.contract_signed_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        )}
      </Section>

      {/* Payout */}
      <Section title="Payout details" icon={Banknote} required>
        <p className="text-[12.5px] text-[#6B7280] mb-3">
          Add at least one payout method. We&apos;ll use this when transferring your earnings.
        </p>
        <SubSection title="GCash">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="GCash number">
              <Input value={form.gcash_number} onChange={(v) => setForm((p) => ({ ...p, gcash_number: v }))} placeholder="0917XXXXXXX" />
            </Field>
            <Field label="Account holder name">
              <Input value={form.gcash_holder_name} onChange={(v) => setForm((p) => ({ ...p, gcash_holder_name: v }))} placeholder="As shown in GCash" />
            </Field>
          </div>
        </SubSection>
        <SubSection title="Maya (optional)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Maya number">
              <Input value={form.maya_number} onChange={(v) => setForm((p) => ({ ...p, maya_number: v }))} placeholder="0917XXXXXXX" />
            </Field>
            <Field label="Account holder name">
              <Input value={form.maya_holder_name} onChange={(v) => setForm((p) => ({ ...p, maya_holder_name: v }))} placeholder="As shown in Maya" />
            </Field>
          </div>
        </SubSection>
        <SubSection title="Bank transfer (optional)">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Bank">
              <Input value={form.bank_name} onChange={(v) => setForm((p) => ({ ...p, bank_name: v }))} placeholder="BDO / BPI / UnionBank" />
            </Field>
            <Field label="Account name">
              <Input value={form.bank_account_name} onChange={(v) => setForm((p) => ({ ...p, bank_account_name: v }))} placeholder="As shown on statement" />
            </Field>
            <Field label="Account number">
              <Input value={form.bank_account_number} onChange={(v) => setForm((p) => ({ ...p, bank_account_number: v }))} placeholder="1234567890" />
            </Field>
          </div>
        </SubSection>
      </Section>

      {/* Tax */}
      <Section title="Tax info (optional)" icon={CreditCard}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="TIN / VAT ID">
            <Input value={form.tax_id} onChange={(v) => setForm((p) => ({ ...p, tax_id: v }))} placeholder="123-456-789-000" />
          </Field>
          <Field label="Registered name">
            <Input value={form.tax_registered_name} onChange={(v) => setForm((p) => ({ ...p, tax_registered_name: v }))} placeholder="As registered with BIR" />
          </Field>
        </div>
      </Section>

      {/* Save */}
      <div className="sticky bottom-3 z-10 mt-6">
        <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-3 shadow-lg flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-[#6B7280]">
            {reg.ready_for_review
              ? "Looks good! Save to submit for review."
              : `Still needed: ${(reg.missing || []).join(", ") || "—"}`}
          </p>
          <button
            type="button"
            onClick={saveText}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-[#B8860B] hover:bg-[#8B6508] text-white font-semibold text-[13px] disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function ChecklistCard({ label, done }: { label: string; done: boolean }) {
  return (
    <div
      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 text-center ${
        done
          ? "border-[#16a34a] bg-[#dcfce7]/40"
          : "border-[#e5e7eb] bg-white"
      }`}
    >
      {done ? (
        <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
      ) : (
        <Clock className="w-5 h-5 text-[#9CA3AF]" />
      )}
      <span className={`text-[11.5px] font-semibold ${done ? "text-[#16a34a]" : "text-[#374151]"}`}>
        {label}
      </span>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  required,
  children,
}: {
  title: string;
  icon: typeof Building2;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[#B8860B]" />
        <h3 className={`text-[15px] font-medium text-[#111827] ${fontFraunces}`}>{title}</h3>
        {required && (
          <span className="text-[9.5px] uppercase tracking-wider font-bold text-[#dc2626]">Required</span>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-dashed border-[#e5e7eb] pt-3 mt-3 first:border-0 first:pt-0 first:mt-0">
      <div className="text-[11px] uppercase tracking-wider font-semibold text-[#6B7280] mb-2">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11.5px] font-semibold text-[#374151] mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder || "Input"}
      className="w-full px-3 py-2.5 border-2 border-[#e5e7eb] bg-white text-[#111827] rounded-xl outline-none focus:border-[#B8860B] text-[14px] placeholder:text-[#9CA3AF]"
    />
  );
}

function UploadBlock({
  hasFile,
  previewUrl,
  onUpload,
  placeholder,
  accept,
}: {
  hasFile: boolean;
  previewUrl: string | null;
  onUpload: (f: File) => void;
  placeholder: string;
  accept: string;
}) {
  const [uploading, setUploading] = useState(false);
  return (
    <div>
      {hasFile && previewUrl && (
        <div className="mb-2 flex items-center gap-2 p-2 bg-[#dcfce7] border border-[#16a34a]/20 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-semibold text-[#16a34a] hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" /> View uploaded file
          </a>
          <span className="text-[11px] text-[#16a34a]/80 ml-auto">Re-upload to replace</span>
        </div>
      )}
      <label
        className={`flex items-center justify-center gap-2 w-full px-3 py-3 rounded-xl text-[12.5px] font-semibold border-2 border-dashed cursor-pointer transition ${
          uploading
            ? "border-[#B8860B] bg-[#FEF3C7] text-[#B8860B] cursor-wait"
            : "border-[#B8860B]/40 bg-[#FEF3C7]/40 text-[#B8860B] hover:bg-[#FEF3C7]"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" /> {placeholder}
          </>
        )}
        <input
          type="file"
          accept={accept}
          disabled={uploading}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            try {
              await onUpload(file);
            } finally {
              setUploading(false);
              e.target.value = "";
            }
          }}
        />
      </label>
    </div>
  );
}
