"use client";

import { useState, useEffect } from "react";
import { Input } from "@nextui-org/input";
import { z } from "zod";

// Underlying DB columns are still `tower`, `floor`, `view_type` — only the labels and
// meanings change so partners can describe their property in natural terms.
//   tower      → Location name (e.g. "M Place South Triangle")
//   floor      → Specific details (e.g. "Unit 3B, 12th floor")
//   view_type  → Nearby areas (e.g. "5 min to MOA, walk to SM Mall, near MRT")
const basicInfoSchema = z.object({
  haven_name: z.string().min(1, "Haven Name is required"),
  tower: z.string().min(1, "Location name is required"),
  floor: z.string().min(1, "Specific details are required"),
  view_type: z.string().min(1, "Please list at least one nearby area"),
});

interface BasicInformationData {
  haven_name?: string;
  tower?: string;
  floor?: string;
  view_type?: string;
}

interface BasicInformationModalProps {
  onSave: (data: BasicInformationData) => void;
  initialData?: BasicInformationData;
  isAddMode?: boolean;
}

const BasicInformationModal = ({
  onSave,
  initialData,
}: BasicInformationModalProps) => {
  const [formData, setFormData] = useState<BasicInformationData>({
    haven_name: "",
    tower: "",
    floor: "",
    view_type: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        haven_name: initialData.haven_name || "",
        tower: initialData.tower || "",
        floor: initialData.floor || "",
        view_type: initialData.view_type || "",
      });
    }
  }, [initialData]);

  const validation = basicInfoSchema.safeParse(formData);
  const errors = !validation.success ? validation.error.format() : null;

  const handleChange = (field: keyof BasicInformationData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setTouched((prev) => ({ ...prev, [field]: true }));
    onSave(newData);
  };

  const getInputClasses = (field: keyof BasicInformationData) => {
    const isFieldTouched = touched[field];
    const isFieldInvalid = isFieldTouched && errors?.[field];
    const isFieldValid = isFieldTouched && !errors?.[field];

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
        "px-4",
      ].join(" "),
      input:
        "text-base font-semibold text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500",
      errorMessage:
        "text-xs font-bold text-red-500 dark:text-red-400 mt-1.5 ml-1 animate-in slide-in-from-top-1",
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
      <div className="space-y-6">
        {/* Guide Box */}
        <div className="flex items-start gap-3 p-4 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 rounded-2xl">
          <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/15 text-brand-primary text-xs font-bold flex-shrink-0">
            ?
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-0.5">
              What is this step?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Fill in the basic identity of your haven — its name, where it&apos;s located,
              the specific unit details, and what guests can find nearby. This is the first
              information guests and admins will see on your listing.
            </p>
          </div>
        </div>

        <Input
          label="Haven Name"
          labelPlacement="outside"
          placeholder="e.g., Cozy Studio at MOA"
          value={formData.haven_name}
          onChange={(e) => handleChange("haven_name", e.target.value)}
          classNames={getInputClasses("haven_name")}
          isInvalid={touched.haven_name && !!errors?.haven_name}
          errorMessage={touched.haven_name && errors?.haven_name?._errors[0]}
          isRequired
        />

        <Input
          label="Location Name"
          labelPlacement="outside"
          placeholder="e.g., M Place South Triangle, SMDC Light Residences"
          description="The building, condominium, or neighborhood the haven is in."
          value={formData.tower}
          onChange={(e) => handleChange("tower", e.target.value)}
          classNames={getInputClasses("tower")}
          isInvalid={touched.tower && !!errors?.tower}
          errorMessage={touched.tower && errors?.tower?._errors[0]}
          isRequired
        />

        <Input
          label="Specific Details"
          labelPlacement="outside"
          placeholder="e.g., Tower B, Unit 12-F, 12th floor"
          description="Tower, unit, floor — any details guests will need to find the room."
          value={formData.floor}
          onChange={(e) => handleChange("floor", e.target.value)}
          classNames={getInputClasses("floor")}
          isInvalid={touched.floor && !!errors?.floor}
          errorMessage={touched.floor && errors?.floor?._errors[0]}
          isRequired
        />

        <Input
          label="Nearby Areas"
          labelPlacement="outside"
          placeholder="e.g., 5 min walk to MOA, near SM Mall, beside MRT-3 Boni"
          description="List landmarks, malls, or transit stops close to the haven. Comma-separated."
          value={formData.view_type}
          onChange={(e) => handleChange("view_type", e.target.value)}
          classNames={getInputClasses("view_type")}
          isInvalid={touched.view_type && !!errors?.view_type}
          errorMessage={touched.view_type && errors?.view_type?._errors[0]}
          isRequired
        />
      </div>
    </div>
  );
};

export default BasicInformationModal;
