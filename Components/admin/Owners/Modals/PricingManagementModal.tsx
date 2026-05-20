"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { Button } from "@nextui-org/button";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";

// Single rate entry stored in havens.rates JSONB.
// check_in / check_out are set in the Check-in step (the Pricing step only handles label/hours/price).
export interface RateEntry {
  label: string;
  hours: number;
  price: number;
  check_in?: string;  // "HH:MM" 24-hour
  check_out?: string; // "HH:MM" 24-hour
}

const rateRowSchema = z.object({
  label: z.string().min(1, "Label is required"),
  hours: z.number().positive("Hours must be > 0"),
  price: z.number().positive("Price must be > 0"),
});

export const pricingSchema = z
  .object({
    rates: z.array(rateRowSchema).min(1, "Add at least one rate"),
  });

interface PricingData {
  rates?: RateEntry[];
  // legacy fallback fields (still accepted from older haven records)
  six_hour_rate?: number | string;
  ten_hour_rate?: number | string;
  weekday_rate?: number | string;
  weekend_rate?: number | string;
}

interface Haven {
  id: string;
  uuid_id?: string;
  name: string;
  haven_name?: string;
  rates?: RateEntry[];
  six_hour_price?: number;
  ten_hour_price?: number;
  weekday_price?: number;
  weekend_price?: number;
  six_hour_rate?: number;
  ten_hour_rate?: number;
  weekday_rate?: number;
  weekend_rate?: number;
}

interface PricingManagementModalProps {
  onSave: (data: { rates: RateEntry[] }) => void;
  initialData?: PricingData;
  haven?: Haven | null;
  havens?: Haven[];
  isAddMode?: boolean;
  /** "step" when rendered inside the Add New Haven wizard — hides the property selector */
  mode?: string;
}

interface RateRow {
  id: string;
  label: string;
  hours: string;
  price: string;
}

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// Convert legacy fixed columns into rate entries (only non-zero ones)
const legacyRatesToEntries = (src: Haven | PricingData): RateEntry[] => {
  const out: RateEntry[] = [];
  const push = (label: string, hours: number, ...vals: (number | string | undefined)[]) => {
    for (const v of vals) {
      const n = Number(v);
      if (v !== undefined && v !== null && v !== "" && !isNaN(n) && n > 0) {
        out.push({ label, hours, price: n });
        return;
      }
    }
  };
  const s = src as Haven & PricingData;
  push("6 Hours", 6, s.six_hour_price, s.six_hour_rate);
  push("10 Hours", 10, s.ten_hour_price, s.ten_hour_rate);
  push("Weekday (21 Hours)", 21, s.weekday_price, s.weekday_rate);
  push("Weekend (21 Hours)", 21, s.weekend_price, s.weekend_rate);
  return out;
};

const PricingManagementModal = ({
  onSave,
  initialData,
  haven,
  havens = [],
  isAddMode = false,
  mode,
}: PricingManagementModalProps) => {
  const isWizardStep = mode === "step";

  const [rates, setRates] = useState<RateRow[]>([]);
  const [selectedHaven, setSelectedHaven] = useState<string>("");
  const [touched, setTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanHavens = Array.isArray(havens)
    ? havens.map((h) => ({
        id: String(h?.id || h?.uuid_id || ""),
        name: String(h?.name || h?.haven_name || "Unknown"),
      }))
    : [];

  // Convert form rows back to clean RateEntry array (skips empty rows)
  const buildEntries = (rows: RateRow[]): RateEntry[] =>
    rows
      .map((r) => ({
        label: r.label.trim(),
        hours: parseFloat(r.hours),
        price: parseFloat(r.price),
      }))
      .filter((e) => e.label && !isNaN(e.hours) && e.hours > 0 && !isNaN(e.price) && e.price > 0);

  // Load initial rates ONCE on mount. Parent may re-render with new prop references
  // every keystroke; re-loading on every change would create an infinite loop.
  // If the user closes and reopens the modal, this component unmounts, so didInit resets.
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    const source = haven && !isAddMode ? haven : initialData;
    if (!source) {
      didInitRef.current = true;
      return;
    }
    try {
      if (haven && !isAddMode) {
        setSelectedHaven(haven.id || haven.uuid_id || "");
      }
      const entries: RateEntry[] =
        Array.isArray(source.rates) && source.rates.length > 0
          ? source.rates
          : legacyRatesToEntries(source);
      setRates(
        entries.map((e) => ({
          id: makeId(),
          label: e.label || "",
          hours: e.hours ? String(e.hours) : "",
          price: e.price ? String(e.price) : "",
        }))
      );
      setError(null);
    } catch (err) {
      console.error("[PricingManagementModal] Error loading rates:", err);
      setError("Failed to load pricing data");
    } finally {
      didInitRef.current = true;
    }
  }, [initialData, haven, isAddMode]);

  // Direct parent sync helper — call inside handlers instead of useEffect to avoid loops
  const syncUp = (next: RateRow[]) => {
    if (isWizardStep) onSave({ rates: buildEntries(next) });
  };

  const entries = useMemo(() => buildEntries(rates), [rates]);

  const addRate = () => {
    const next: RateRow[] = [...rates, { id: makeId(), label: "", hours: "", price: "" }];
    setRates(next);
    syncUp(next);
    setError(null);
  };

  const updateRate = (id: string, field: "label" | "hours" | "price", value: string) => {
    // Hard cap: hours can never exceed 24 (a single stay is bounded by a day)
    let clamped = value;
    if (field === "hours" && value !== "") {
      const n = parseFloat(value);
      if (!isNaN(n) && n > 24) clamped = "24";
    }
    const next = rates.map((r) => (r.id === id ? { ...r, [field]: clamped } : r));
    setRates(next);
    syncUp(next);
    setError(null);
  };

  const removeRate = (id: string) => {
    const next = rates.filter((r) => r.id !== id);
    setRates(next);
    syncUp(next);
    setError(null);
  };

  const rowErrors = useMemo(() => {
    const errs: Record<string, { label?: string; hours?: string; price?: string }> = {};
    rates.forEach((r) => {
      const e: { label?: string; hours?: string; price?: string } = {};
      if (!r.label.trim()) e.label = "Label required";
      const h = parseFloat(r.hours);
      if (!r.hours.trim()) e.hours = "Hours required";
      else if (isNaN(h) || h <= 0) e.hours = "Must be > 0";
      else if (h > 24) e.hours = "Max 24";
      const p = parseFloat(r.price);
      if (!r.price.trim()) e.price = "Price required";
      else if (isNaN(p) || p <= 0) e.price = "Must be > 0";
      if (Object.keys(e).length) errs[r.id] = e;
    });
    return errs;
  }, [rates]);

  const hasRowErrors = Object.keys(rowErrors).length > 0;

  const handleSave = async () => {
    setTouched(true);

    const isInvalidHaven = !selectedHaven || selectedHaven === "__no_properties__";
    if (isAddMode && !isWizardStep && isInvalidHaven) {
      setError("Please select a property first");
      return;
    }

    if (rates.length === 0) {
      setError("Please add at least one rate before saving");
      return;
    }

    if (hasRowErrors) {
      setError("Please fix the errors in the rates list before saving");
      return;
    }

    if (isWizardStep) {
      onSave({ rates: entries });
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const havenId = isAddMode ? selectedHaven : haven?.id;
      if (!havenId) throw new Error("No haven selected");

      const response = await fetch(`/api/haven/${havenId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates: entries }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update pricing");
      }

      onSave({ rates: entries });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while saving");
      console.error("[PricingManagementModal] Error saving pricing:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClasses = (hasError: boolean, isValid: boolean) => {
    let borderClass = "border-gray-200 dark:border-gray-700";
    if (hasError) borderClass = "border-red-500 bg-red-50/10 dark:bg-red-900/10";
    else if (isValid) borderClass = "border-green-500 bg-green-50/10 dark:bg-green-900/10";
    return {
      label: "text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-wider",
      inputWrapper: [
        "bg-white dark:bg-gray-700",
        `border-2 ${borderClass}`,
        "hover:border-brand-primary/40",
        "focus-within:!border-brand-primary",
        "focus-within:ring-4",
        "focus-within:ring-brand-primary/10",
        "shadow-sm",
        "transition-all",
        "duration-300",
        "rounded-xl",
        "h-12",
        "px-3",
      ].join(" "),
      input: "text-sm font-semibold text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500",
      errorMessage: "text-xs font-bold text-red-500 dark:text-red-400 mt-1 ml-1",
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
      <div className="space-y-8">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {isAddMode && !isWizardStep && (
          <div>
            <Select
              label="Select Property"
              placeholder="Choose a property"
              value={selectedHaven}
              onChange={(e) => {
                setSelectedHaven(e.target.value);
                setError(null);
              }}
              isRequired
              disabledKeys={cleanHavens.length === 0 ? ["__no_properties__"] : []}
              classNames={{
                label: "text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 uppercase tracking-wider",
                trigger: [
                  "bg-white dark:bg-gray-700",
                  "border-2 border-gray-200 dark:border-gray-700",
                  "hover:border-brand-primary/40",
                  "focus:!border-brand-primary",
                  "focus:ring-4",
                  "focus:ring-brand-primary/10",
                  "shadow-sm",
                  "transition-all",
                  "duration-300",
                  "rounded-2xl",
                  "h-14",
                  "px-4",
                ].join(" "),
              }}
            >
              {cleanHavens && cleanHavens.length > 0 ? (
                cleanHavens.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem key="__no_properties__" value="__no_properties__">
                  No properties available
                </SelectItem>
              )}
            </Select>
          </div>
        )}

        {/* Guide */}
        <div className="flex items-start gap-3 p-4 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 rounded-2xl">
          <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/15 text-brand-primary text-xs font-bold flex-shrink-0">
            ?
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-0.5">
              Set your own rates
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              You decide what rate types to offer — short stays, overnight, weekend specials,
              whatever fits your property. Each rate needs a <strong>label</strong>, the{" "}
              <strong>hours</strong> it covers, and the <strong>price</strong>.
            </p>
          </div>
        </div>

        {/* Rates list */}
        <div>
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Rates Configuration
            </h3>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {rates.length} {rates.length === 1 ? "rate" : "rates"}
            </span>
          </div>

          {rates.length === 0 ? (
            <div className="text-center py-10 px-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                No rates added yet
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Tap “Add rate” below to define your first rate.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rates.map((rate) => {
                const errs = touched ? rowErrors[rate.id] : undefined;
                return (
                  <div
                    key={rate.id}
                    className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_auto] gap-3 items-start p-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl"
                  >
                    <Input
                      type="text"
                      label="Label"
                      labelPlacement="outside"
                      placeholder="e.g. Overnight"
                      value={rate.label}
                      onChange={(e) => updateRate(rate.id, "label", e.target.value)}
                      classNames={fieldClasses(!!errs?.label, !!(touched && !errs?.label && rate.label.trim()))}
                      isInvalid={!!errs?.label}
                      errorMessage={errs?.label}
                    />
                    <Input
                      type="number"
                      label="Hours"
                      labelPlacement="outside"
                      placeholder="e.g. 8"
                      min={1}
                      max={24}
                      step={1}
                      value={rate.hours}
                      onChange={(e) => updateRate(rate.id, "hours", e.target.value)}
                      classNames={fieldClasses(!!errs?.hours, !!(touched && !errs?.hours && rate.hours.trim()))}
                      isInvalid={!!errs?.hours}
                      errorMessage={errs?.hours}
                      endContent={<span className="text-gray-500 text-xs font-medium">hrs</span>}
                    />
                    <Input
                      type="number"
                      label="Price"
                      labelPlacement="outside"
                      placeholder="0.00"
                      value={rate.price}
                      onChange={(e) => updateRate(rate.id, "price", e.target.value)}
                      classNames={fieldClasses(!!errs?.price, !!(touched && !errs?.price && rate.price.trim()))}
                      isInvalid={!!errs?.price}
                      errorMessage={errs?.price}
                      startContent={<span className="text-gray-500 dark:text-gray-400 font-medium">₱</span>}
                    />
                    <Button
                      type="button"
                      isIconOnly
                      onPress={() => removeRate(rate.id)}
                      className="bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl mt-6"
                      aria-label={`Remove rate ${rate.label || "untitled"}`}
                      title={`Remove rate ${rate.label || "untitled"}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add rate */}
          <div className="mt-5">
            <Button
              type="button"
              onPress={addRate}
              startContent={<Plus className="w-4 h-4" />}
              className="bg-white dark:bg-gray-700 border-2 border-dashed border-brand-primary/40 text-brand-primary hover:bg-brand-primary/5 font-semibold rounded-xl w-full h-12"
            >
              Add rate
            </Button>
          </div>
        </div>

        {!isWizardStep && (
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onPress={handleSave}
              isDisabled={isSaving}
              className="flex-1 bg-brand-primary hover:bg-brand-primaryDarker text-white font-bold rounded-xl h-12 transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingManagementModal;
