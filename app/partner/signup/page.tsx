"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Mail, Lock, User, Phone, MapPin, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useRegisterPartnerMutation } from "@/redux/api/partnerRegistrationApi";

const fontFraunces = "font-[var(--font-fraunces),Georgia,serif]";

export default function PartnerSignupPage() {
  const router = useRouter();
  const [registerPartner, { isLoading }] = useRegisterPartnerMutation();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullname: "",
    phone: "",
    business_name: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const update = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "At least 8 characters";
    if (form.confirmPassword !== form.password) e.confirmPassword = "Passwords don't match";
    if (!form.fullname.trim()) e.fullname = "Full name is required";
    if (form.phone && !/^\+?[0-9 -]{7,15}$/.test(form.phone)) e.phone = "Enter a valid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    try {
      await registerPartner({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        fullname: form.fullname.trim(),
        phone: form.phone.trim() || undefined,
        business_name: form.business_name.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        province: form.province.trim() || undefined,
        postal_code: form.postal_code.trim() || undefined,
      }).unwrap();
      setSubmitted(true);
      toast.success("Account created! Log in to finish onboarding.");
    } catch (err) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Registration failed";
      toast.error(msg);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center p-6">
        <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-[#dcfce7] text-[#16a34a] grid place-items-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className={`text-[24px] font-medium text-[#111827] mb-2 ${fontFraunces}`}>
            You&apos;re registered!
          </h1>
          <p className="text-[14px] text-[#6B7280] mb-6">
            Log in with your email and password. You&apos;ll be guided through uploading your ID,
            signing the partner contract, and entering payout details before our team reviews
            your application.
          </p>
          <button
            type="button"
            onClick={() => router.push("/admin/login")}
            className="w-full px-4 py-3 rounded-xl bg-[#B8860B] hover:bg-[#8B6508] text-white font-semibold text-[14px] transition inline-flex items-center justify-center gap-2"
          >
            Go to login <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="max-w-[640px] mx-auto p-6 pt-10">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B8860B] to-[#1f2937] text-white grid place-items-center text-xl font-semibold">
            S
          </div>
          <div>
            <div className={`text-[18px] font-medium text-[#111827] ${fontFraunces}`}>
              Staycation Haven
            </div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-[#6B7280] font-semibold">
              Partner application
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-sm p-8">
          <h1 className={`text-[28px] font-medium text-[#111827] mb-2 ${fontFraunces}`}>
            List your property with us
          </h1>
          <p className="text-[14px] text-[#6B7280] mb-6">
            Tell us about yourself. After signing up, you&apos;ll upload your ID, sign the partner
            contract, and add payout details. Our team reviews every application before your
            listings go public.
          </p>

          {/* Account credentials */}
          <Section title="Account">
            <FieldRow>
              <Field label="Email" error={errors.email} icon={Mail}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@example.com"
                  aria-label="Email"
                  autoComplete="email"
                  className={inputCls(errors.email)}
                />
              </Field>
            </FieldRow>
            <FieldRow cols={2}>
              <Field label="Password" error={errors.password} icon={Lock}>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="At least 8 characters"
                  aria-label="Password"
                  autoComplete="new-password"
                  className={inputCls(errors.password)}
                />
              </Field>
              <Field label="Confirm password" error={errors.confirmPassword} icon={Lock}>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  aria-label="Confirm password"
                  autoComplete="new-password"
                  className={inputCls(errors.confirmPassword)}
                />
              </Field>
            </FieldRow>
          </Section>

          {/* Personal */}
          <Section title="About you">
            <FieldRow cols={2}>
              <Field label="Full name" error={errors.fullname} icon={User}>
                <input
                  type="text"
                  value={form.fullname}
                  onChange={(e) => update("fullname", e.target.value)}
                  placeholder="Maria Santos"
                  aria-label="Full name"
                  autoComplete="name"
                  className={inputCls(errors.fullname)}
                />
              </Field>
              <Field label="Phone" error={errors.phone} icon={Phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+63 917 000 0000"
                  aria-label="Phone"
                  autoComplete="tel"
                  className={inputCls(errors.phone)}
                />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Business name (optional)" icon={Building2}>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={(e) => update("business_name", e.target.value)}
                  placeholder="e.g. Casa Verde Staycation"
                  aria-label="Business name"
                  className={inputCls()}
                />
              </Field>
            </FieldRow>
          </Section>

          {/* Address (optional, but encouraged) */}
          <Section title="Address (optional)">
            <FieldRow>
              <Field label="Street address" icon={MapPin}>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Unit 12-F, M Place South Triangle"
                  aria-label="Street address"
                  autoComplete="street-address"
                  className={inputCls()}
                />
              </Field>
            </FieldRow>
            <FieldRow cols={3}>
              <Field label="City">
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Quezon City"
                  aria-label="City"
                  autoComplete="address-level2"
                  className={inputCls()}
                />
              </Field>
              <Field label="Province / Region">
                <input
                  type="text"
                  value={form.province}
                  onChange={(e) => update("province", e.target.value)}
                  placeholder="Metro Manila"
                  aria-label="Province"
                  autoComplete="address-level1"
                  className={inputCls()}
                />
              </Field>
              <Field label="Postal code">
                <input
                  type="text"
                  value={form.postal_code}
                  onChange={(e) => update("postal_code", e.target.value)}
                  placeholder="1103"
                  aria-label="Postal code"
                  autoComplete="postal-code"
                  className={inputCls()}
                />
              </Field>
            </FieldRow>
          </Section>

          <button
            type="button"
            onClick={submit}
            disabled={isLoading}
            className="w-full mt-6 px-4 py-3 rounded-xl bg-[#B8860B] hover:bg-[#8B6508] text-white font-semibold text-[14px] transition inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating account…
              </>
            ) : (
              <>
                Create partner account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[12px] text-[#6B7280] text-center mt-4">
            Already have a partner account?{" "}
            <Link href="/admin/login" className="text-[#B8860B] font-semibold hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputCls = (err?: string) =>
  `w-full pl-10 pr-3 py-2.5 border-2 rounded-xl outline-none text-[14px] text-[#111827] placeholder:text-[#9CA3AF] transition focus:border-[#B8860B] ${
    err ? "border-[#dc2626] bg-[#fee2e2]/30" : "border-[#e5e7eb] bg-white"
  }`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#6B7280] mb-3">
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FieldRow({ children, cols }: { children: React.ReactNode; cols?: 2 | 3 }) {
  const gridClass =
    cols === 3 ? "grid-cols-1 sm:grid-cols-3" : cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1";
  return <div className={`grid ${gridClass} gap-3`}>{children}</div>;
}

function Field({
  label,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  error?: string;
  icon?: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
            <Icon className="w-4 h-4" />
          </span>
        )}
        {children}
      </div>
      {error && <p className="text-[11px] text-[#dc2626] mt-1">{error}</p>}
    </div>
  );
}
