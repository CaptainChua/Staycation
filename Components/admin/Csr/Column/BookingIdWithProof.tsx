"use client";

import { Image as ImageIcon, ExternalLink } from "lucide-react";

interface BookingIdWithProofProps {
  bookingId: string;
  paymentProofUrl?: string | null;
  onViewProof?: () => void;
  isCompact?: boolean;
}

export default function BookingIdWithProof({
  bookingId,
  paymentProofUrl,
  onViewProof,
  isCompact = false,
}: BookingIdWithProofProps) {
  if (isCompact) {
    return (
      <div className="text-center">
        <div className="mb-2">
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
            {bookingId}
          </span>
        </div>
        {paymentProofUrl ? (
          <a
            href={paymentProofUrl}
            target="_blank"
            rel="noreferrer"
            onClick={onViewProof}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            View
          </a>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">
            No proof
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Booking ID
        </p>
        <p className="font-semibold text-gray-800 dark:text-gray-100">
          {bookingId}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Payment Proof
        </p>
        {paymentProofUrl ? (
          <a
            href={paymentProofUrl}
            target="_blank"
            rel="noreferrer"
            onClick={onViewProof}
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ImageIcon className="w-4 h-4" />
            View Proof
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500 italic">
            No proof
          </span>
        )}
      </div>
    </div>
  );
}
