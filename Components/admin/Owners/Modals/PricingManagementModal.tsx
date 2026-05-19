"use client";

import { useState, useEffect } from "react";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { Button } from "@nextui-org/button";
import { z } from "zod";
import { Loader2 } from "lucide-react";

const pricingSchema = z.object({
  six_hour_rate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "6-hour rate must be a positive number"),
  ten_hour_rate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "10-hour rate must be a positive number"),
  weekday_rate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Weekday rate must be a positive number"),
  weekend_rate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Weekend rate must be a positive number"),
});

interface PricingData {
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
  onSave: (data: PricingData) => void;
  initialData?: PricingData;
  haven?: Haven | null;
  havens?: Haven[];
  isAddMode?: boolean;
  /** "step" when rendered inside the Add New Haven wizard — hides the property selector */
  mode?: string;
}

const PricingManagementModal = ({
  onSave,
  initialData,
  haven,
  havens = [],
  isAddMode = false,
  mode,
}: PricingManagementModalProps) => {
  // Inside the wizard the haven is being created, so no existing property to select
  const isWizardStep = mode === "step";
  const [formData, setFormData] = useState<Record<string, string>>({
    six_hour_rate: "",
    ten_hour_rate: "",
    weekday_rate: "",
    weekend_rate: "",
  });

  const [selectedHaven, setSelectedHaven] = useState<string>("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ensure havens are simple objects without proxies
  const cleanHavens = Array.isArray(havens) ? havens.map(h => ({
    id: String(h?.id || h?.uuid_id || ""),
    name: String(h?.name || h?.haven_name || "Unknown")
  })) : [];

  // Clear stale errors when the component mounts (e.g. when the wizard navigates to this step)
  useEffect(() => { setError(null); }, []);

  useEffect(() => {
    if (haven && !isAddMode) {
      try {
        const havenId = haven.id || haven.uuid_id || "";
        setSelectedHaven(havenId);
        setFormData({
          six_hour_rate: (haven.six_hour_price || haven.six_hour_rate || "").toString(),
          ten_hour_rate: (haven.ten_hour_price || haven.ten_hour_rate || "").toString(),
          weekday_rate: (haven.weekday_price || haven.weekday_rate || "").toString(),
          weekend_rate: (haven.weekend_price || haven.weekend_rate || "").toString(),
        });
      } catch (err) {
        console.error("[PricingManagementModal] Error loading haven data:", err);
        setError("Failed to load pricing data");
      }
    } else if (initialData) {
      setFormData({
        six_hour_rate: initialData.six_hour_rate?.toString() || "",
        ten_hour_rate: initialData.ten_hour_rate?.toString() || "",
        weekday_rate: initialData.weekday_rate?.toString() || "",
        weekend_rate: initialData.weekend_rate?.toString() || "",
      });
    }
  }, [initialData, haven, isAddMode]);

  const validation = pricingSchema.safeParse(formData);
  const errors = !validation.success
    ? validation.error.flatten((i) => i.message).fieldErrors
    : null;

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setTouched(prev => ({ ...prev, [field]: true }));
    setError(null);
    if (isWizardStep) onSave(newData);
  };

  const handleSave = async () => {
    setTouched({
      six_hour_rate: true,
      ten_hour_rate: true,
      weekday_rate: true,
      weekend_rate: true,
    });

    // In standalone add mode (not the wizard), a property must be selected
    const isInvalidHaven = !selectedHaven || selectedHaven === "__no_properties__";
    if (isAddMode && !isWizardStep && isInvalidHaven) {
      setError("Please select a property first");
      return;
    }

    if (!validation.success) {
      setError("Please fix all errors before saving");
      return;
    }

    const pricingData = {
      six_hour_rate: formData.six_hour_rate,
      ten_hour_rate: formData.ten_hour_rate,
      weekday_rate: formData.weekday_rate,
      weekend_rate: formData.weekend_rate,
    };

    // In wizard mode just hand the data to the parent — the haven doesn't exist yet
    if (isWizardStep) {
      onSave(pricingData);
      return;
    }

    // Standalone mode: persist pricing to an existing haven via API
    try {
      setIsSaving(true);
      setError(null);

      const havenId = isAddMode ? selectedHaven : haven?.id;

      if (!havenId) {
        throw new Error("No haven selected");
      }

      const response = await fetch(`/api/haven/${havenId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          six_hour_price: parseFloat(formData.six_hour_rate),
          ten_hour_price: parseFloat(formData.ten_hour_rate),
          weekday_price: parseFloat(formData.weekday_rate),
          weekend_price: parseFloat(formData.weekend_rate),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update pricing");
      }

      onSave(pricingData);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred while saving");
      console.error("[PricingManagementModal] Error saving pricing:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getInputClasses = (field: string) => {
    const isFieldTouched = touched[field];
    const isFieldInvalid = isFieldTouched && errors?.[field as keyof typeof errors];
    const isFieldValid = isFieldTouched && !errors?.[field as keyof typeof errors];

    let borderClass = "border-gray-200 dark:border-gray-700";
    if (isFieldInvalid) borderClass = "border-red-500 bg-red-50/10 dark:bg-red-900/10";
    if (isFieldValid) borderClass = "border-green-500 bg-green-50/10 dark:bg-green-900/10";

    return {
      label: "text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 uppercase tracking-wider",
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
        "rounded-2xl",
        "h-14",
        "px-4"
      ].join(" "),
      input: "text-base font-semibold text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500",
      errorMessage: "text-xs font-bold text-red-500 dark:text-red-400 mt-1.5 ml-1 animate-in slide-in-from-top-1"
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.01] hover:shadow-md will-change-transform">
      <div className="space-y-8">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Property Selection - Only in standalone Add Mode (not inside the wizard) */}
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
                  "px-4"
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

        {/* Guide Box */}
        <div className="flex items-start gap-3 p-4 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 rounded-2xl">
          <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/15 text-brand-primary text-xs font-bold flex-shrink-0">?</span>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-0.5">What is this step?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Set how much guests pay for each type of stay. The <span className="font-medium text-gray-600 dark:text-gray-300">6-Hour</span> and <span className="font-medium text-gray-600 dark:text-gray-300">10-Hour</span> rates are for daytime visits. The <span className="font-medium text-gray-600 dark:text-gray-300">Weekday</span> and <span className="font-medium text-gray-600 dark:text-gray-300">Weekend</span> rates apply to overnight (21-hour) bookings — weekend rates are typically higher due to demand.</p>
          </div>
        </div>

        {/* Rates Configuration */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
            Rates Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              type="number"
              label="6-Hour Rate"
              labelPlacement="outside"
              placeholder="0.00"
              value={formData.six_hour_rate}
              onChange={(e) => handleChange('six_hour_rate', e.target.value)}
              classNames={getInputClasses('six_hour_rate')}
              isInvalid={touched.six_hour_rate && !!errors?.six_hour_rate}
              errorMessage={touched.six_hour_rate && (errors as any)?.six_hour_rate?.[0]}
              startContent={<span className="text-gray-500 dark:text-gray-400 font-medium">₱</span>}
              isRequired
            />
            <Input
              type="number"
              label="10-Hour Rate"
              labelPlacement="outside"
              placeholder="0.00"
              value={formData.ten_hour_rate}
              onChange={(e) => handleChange('ten_hour_rate', e.target.value)}
              classNames={getInputClasses('ten_hour_rate')}
              isInvalid={touched.ten_hour_rate && !!errors?.ten_hour_rate}
              errorMessage={touched.ten_hour_rate && (errors as any)?.ten_hour_rate?.[0]}
              startContent={<span className="text-gray-500 dark:text-gray-400 font-medium">₱</span>}
              isRequired
            />
            <Input
              type="number"
              label="Weekday (21-Hour) Rate"
              labelPlacement="outside"
              placeholder="0.00"
              value={formData.weekday_rate}
              onChange={(e) => handleChange('weekday_rate', e.target.value)}
              classNames={getInputClasses('weekday_rate')}
              isInvalid={touched.weekday_rate && !!errors?.weekday_rate}
              errorMessage={touched.weekday_rate && (errors as any)?.weekday_rate?.[0]}
              startContent={<span className="text-gray-500 dark:text-gray-400 font-medium">₱</span>}
              isRequired
            />
            <Input
              type="number"
              label="Weekend (21-Hour) Rate"
              labelPlacement="outside"
              placeholder="0.00"
              value={formData.weekend_rate}
              onChange={(e) => handleChange('weekend_rate', e.target.value)}
              classNames={getInputClasses('weekend_rate')}
              isInvalid={touched.weekend_rate && !!errors?.weekend_rate}
              errorMessage={touched.weekend_rate && (errors as any)?.weekend_rate?.[0]}
              startContent={<span className="text-gray-500 dark:text-gray-400 font-medium">₱</span>}
              isRequired
            />
          </div>
        </div>

        {/* Action Buttons - only shown in standalone mode, not inside the wizard */}
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
                'Save Changes'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingManagementModal;
