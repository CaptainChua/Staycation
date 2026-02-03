"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CreditCard, X, Smartphone, Wallet, Building, Upload, Image as ImageIcon, Trash2 } from "lucide-react";

export interface PaymentMethodData {
  payment_name: string;
  payment_method: "credit_card" | "mobile_wallet" | "bank_transfer" | "cash" | "other";
  provider: string;
  account_details: string;
  payment_qr_link?: string;
  description?: string;
  is_active: boolean;
  qr_image_file?: File;
  remove_qr?: boolean;
}

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMethod?: PaymentMethodData | null;
  onSaved?: () => void;
}

export default function PaymentMethodModal({ 
  isOpen, 
  onClose, 
  editingMethod,
  onSaved
}: PaymentMethodModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<PaymentMethodData>({
    payment_name: "",
    payment_method: "credit_card",
    provider: "",
    account_details: "",
    payment_qr_link: "",
    description: "",
    is_active: true,
  });

  const [qrImagePreview, setQrImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (editingMethod) {
      setForm(editingMethod);
      setQrImagePreview(editingMethod.payment_qr_link || null);
    } else {
      setForm({
        payment_name: "",
        payment_method: "credit_card",
        provider: "",
        account_details: "",
        payment_qr_link: "",
        description: "",
        is_active: true,
      });
      setQrImagePreview(null);
    }
    // Clear messages when modal opens
    setError(null);
    setSuccess(null);
  }, [editingMethod]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const isValid = useMemo(() => {
    return (
      form.payment_name.trim().length > 0 &&
      form.provider.trim().length > 0 &&
      form.account_details.trim().length > 0
    );
  }, [form]);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "credit_card":
        return <CreditCard className="w-5 h-5 text-white" />;
      case "mobile_wallet":
        return (
          <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">G</span>
          </div>
        );
      case "bank_transfer":
        return (
          <div className="w-5 h-5 bg-gray-700 rounded flex items-center justify-center">
            <Building className="w-3 h-3 text-white" />
          </div>
        );
      case "cash":
        return (
          <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">₱</span>
          </div>
        );
      default:
        return <Wallet className="w-5 h-5 text-white" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSaving) return;

    setError(null);
    setSuccess(null);
    setIsSaving(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('payment_name', form.payment_name.trim());
      formData.append('payment_method', form.payment_method);
      formData.append('provider', form.provider.trim());
      formData.append('account_details', form.account_details.trim());
      formData.append('description', form.description?.trim() || "");
      formData.append('is_active', form.is_active.toString());
      
      if (form.qr_image_file) {
        formData.append('qr_image', form.qr_image_file);
      }
      
      if (form.remove_qr) {
        formData.append('remove_qr', 'true');
      }
      
      const url = editingMethod 
        ? `/api/payment-methods/${editingMethod.id}`
        : "/api/payment-methods";
      
      const method = editingMethod ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save payment method");
      }
      
      setSuccess(editingMethod ? "Payment method updated successfully." : "Payment method added successfully.");
      onSaved?.(); // Call parent to refresh table
      window.setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save payment method";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9980] bg-black/50"
        aria-hidden="true"
        onClick={handleClose}
        role="button"
        tabIndex={-1}
      />
      <div
        className="fixed z-[9991] w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              {getPaymentIcon(form.payment_method)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {editingMethod ? "Edit Payment Method" : "Add Payment Method"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {editingMethod 
                  ? "Update payment method details and settings."
                  : "Create a new payment method for guest transactions."
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form id="payment-method-form" onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-4 py-3 text-sm">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Payment Method Information */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <CreditCard className="w-4 h-4" />
                Payment Method Details
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Payment Name
                  </label>
                  <input
                    value={form.payment_name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, payment_name: e.target.value }))
                    }
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., Credit Card Payment"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Payment Method Type
                  </label>
                  <div className="relative">
                    <select
                      value={form.payment_method}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          payment_method: e.target.value as PaymentMethodData["payment_method"],
                        }))
                      }
                      disabled={isSaving}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer"
                    >
                      <option value="credit_card">Credit Card</option>
                      <option value="mobile_wallet">Mobile Wallet</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      {getPaymentIcon(form.payment_method)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Provider
                  </label>
                  <input
                    value={form.provider}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, provider: e.target.value }))
                    }
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., GCash, PayPal, BDO"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Account Details
                  </label>
                  <input
                    value={form.account_details}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, account_details: e.target.value }))
                    }
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
                    placeholder="Account number, wallet number, etc."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    QR Code Image (Optional)
                  </label>
                  <div className="space-y-3">
                    {qrImagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={qrImagePreview}
                          alt="QR Code Preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setQrImagePreview(null);
                            setForm(prev => ({ ...prev, qr_image_file: undefined, remove_qr: true }));
                          }}
                          disabled={isSaving}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div>
                      <label
                        htmlFor="qr_image"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-4 h-4" />
                        {qrImagePreview ? "Change QR Code" : "Upload QR Code"}
                      </label>
                      <input
                        id="qr_image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setForm(prev => ({ ...prev, qr_image_file: file, remove_qr: false }));
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setQrImagePreview(e.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        disabled={isSaving}
                        className="hidden"
                      />
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Upload a QR code image for this payment method. Supported formats: JPG, PNG, GIF, WebP
                    </p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={form.description || ''}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    disabled={isSaving}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                    placeholder="Additional details about this payment method"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, is_active: e.target.checked }))
                      }
                      disabled={isSaving}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Active - Available for guests to use
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {editingMethod ? "Update payment method details" : "Create new payment method"}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isSaving}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {editingMethod ? "Update" : "Add"} Payment Method
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}
