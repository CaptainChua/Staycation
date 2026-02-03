"use client";

import { X, FileText, Shield } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@nextui-org/input";

interface PoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PoliciesModal = ({ isOpen, onClose }: PoliciesModalProps) => {
  const [formData, setFormData] = useState({
    termsAndConditions: `Welcome to Staycation Haven! By booking with us, you agree to the following terms and conditions:

1. Booking and Reservation
- All bookings must be confirmed with a valid payment method
- Confirmation will be sent via email within 24 hours
- Check-in time is 2:00 PM, Check-out time is 12:00 PM

2. Payment Terms
- Full payment is required at the time of booking
- We accept major credit cards, debit cards, and online payment methods
- Prices are subject to change without prior notice

3. Guest Responsibilities
- Maximum occupancy must be strictly observed
- Guests are responsible for any damages to the property
- Smoking is strictly prohibited inside the units
- Pets are not allowed unless specified

4. House Rules
- Maintain noise levels, especially after 10:00 PM
- No illegal activities or substances allowed
- Visitors must be registered at the front desk
- Proper disposal of trash is required`,

    cancellationPolicy: `Cancellation and Refund Policy:

1. Free Cancellation Period
- Cancellations made 7 days or more before check-in: Full refund
- Cancellations made 3-6 days before check-in: 50% refund
- Cancellations made less than 3 days before check-in: No refund

2. No-Show Policy
- Failure to check-in without prior cancellation: No refund
- Early departure does not qualify for partial refunds

3. Modification Policy
- Booking modifications are subject to availability
- Date changes may incur additional charges
- Must be requested at least 48 hours before check-in

4. Force Majeure
- Refunds may be provided in case of natural disasters or government-mandated restrictions
- Documentation may be required for verification

5. Special Circumstances
- Medical emergencies may be considered for partial refunds
- Proper documentation must be provided within 48 hours

For questions or concerns, please contact our customer support team.`,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Policies updated:", formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-5xl w-full max-h-[90vh] shadow-2xl flex flex-col">
          {/* Header - Sticky */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-t-2xl flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Terms & Policies
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your booking terms, conditions, and cancellation policies
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Form - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Terms and Conditions Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      Terms and Conditions
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      General terms that guests must agree to when booking
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800/30">
                  <Textarea
                    label="Terms and Conditions *"
                    placeholder="Enter your terms and conditions..."
                    labelPlacement="outside"
                    value={formData.termsAndConditions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        termsAndConditions: e.target.value,
                      })
                    }
                    minRows={12}
                    isRequired
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2",
                      input: "bg-white dark:bg-gray-700 dark:text-gray-100",
                      inputWrapper: "bg-white dark:bg-gray-700 border-2 border-blue-100 dark:border-blue-800/30"
                    }}
                  />
                  <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-300 dark:border-blue-800/50">
                    <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-2">
                      💡 Tips for Terms and Conditions:
                    </p>
                    <ul className="text-xs text-gray-700 dark:text-gray-400 space-y-1 list-disc list-inside">
                      <li>Include booking and reservation requirements</li>
                      <li>Specify payment terms and methods</li>
                      <li>Outline guest responsibilities and house rules</li>
                      <li>Mention prohibited activities clearly</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Cancellation Policy Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      Cancellation Policy
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Define refund rules and cancellation timeframes
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-xl p-6 border border-red-200 dark:border-red-800/30">
                  <Textarea
                    label="Cancellation Policy *"
                    placeholder="Enter your cancellation policy..."
                    labelPlacement="outside"
                    value={formData.cancellationPolicy}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cancellationPolicy: e.target.value,
                      })
                    }
                    minRows={12}
                    isRequired
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-semibold text-red-900 dark:text-red-300 mb-2",
                      input: "bg-white dark:bg-gray-700 dark:text-gray-100",
                      inputWrapper: "bg-white dark:bg-gray-700 border-2 border-red-100 dark:border-red-800/30"
                    }}
                  />
                  <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-300 dark:border-red-800/50">
                    <p className="text-xs text-red-800 dark:text-red-300 font-medium mb-2">
                      💡 Tips for Cancellation Policy:
                    </p>
                    <ul className="text-xs text-gray-700 dark:text-gray-400 space-y-1 list-disc list-inside">
                      <li>Define clear timeframes for different refund amounts</li>
                      <li>Include no-show and early departure policies</li>
                      <li>Mention force majeure and special circumstances</li>
                      <li>Specify how modifications are handled</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-xl">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-300">
                      Policy Status
                    </h4>
                    <p className="text-xs text-green-700 dark:text-green-400">
                      These policies will be displayed to guests during booking
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-300 dark:border-green-800/50">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Terms Length</p>
                    <p className="font-bold text-green-700 dark:text-green-400">
                      {formData.termsAndConditions.length} characters
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-300 dark:border-green-800/50">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Cancellation Length
                    </p>
                    <p className="font-bold text-green-700 dark:text-green-400">
                      {formData.cancellationPolicy.length} characters
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Footer - Sticky */}
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 font-medium transition-colors shadow-md hover:shadow-lg"
            >
              Save Policies
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PoliciesModal;
