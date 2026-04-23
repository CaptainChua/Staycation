'use client';

import { X, Upload } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface PaymentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentSettingsModal = ({ isOpen, onClose }: PaymentSettingsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCodePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // onClose();
    }, 2000);
  };

  return (
    <>
      {/* Backdrop with animation */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] shadow-2xl animate-in zoom-in-95 fade-in duration-300 flex flex-col">
          {/* Header - Sticky */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-800">Payment Settings</h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Form - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* QR Code Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                GCash QR Code
              </label>
              <input
                type="file"
                id="qr-upload"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="qr-upload"
                className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 cursor-pointer"
              >
                {qrCodePreview ? (
                  <div className="space-y-3">
                    <Image
                      src={qrCodePreview}
                      alt="QR Code Preview"
                      width={160}
                      height={160}
                      className="mx-auto h-40 w-40 object-contain rounded-lg border-2 border-gray-200"
                    />
                    <p className="text-sm text-gray-600">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-orange-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">Click to upload QR code</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Account Name
              </label>
              <input
                type="text"
                placeholder="e.g., Juan Dela Cruz"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200"
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                placeholder="e.g., 09123456789"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200"
              />
            </div>

            {/* Bank & Branch */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bank & Branch
              </label>
              <input
                type="text"
                placeholder="e.g., BDO - Makati Branch"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl border border-gray-200 animate-in zoom-in-95 fade-in duration-300">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-semibold text-lg">Saving Payment Settings...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentSettingsModal;