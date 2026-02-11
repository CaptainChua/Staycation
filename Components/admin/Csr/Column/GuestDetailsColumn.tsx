"use client";

import { User, Mail, Phone, ExternalLink } from "lucide-react";

interface GuestDetailsColumnProps {
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  facebookLink?: string;
  validIdUrl?: string;
  isCompact?: boolean;
}

export default function GuestDetailsColumn({
  guestName,
  guestEmail,
  guestPhone,
  facebookLink,
  validIdUrl,
  isCompact = false,
}: GuestDetailsColumnProps) {
  if (isCompact) {
    return (
      <div className="space-y-2 min-w-[250px]">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
            {guestName}
          </span>
        </div>
        {guestEmail && (
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
            <span className="font-medium">Email:</span>
            <a
              href={`mailto:${guestEmail}`}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              {guestEmail}
            </a>
          </div>
        )}
        {guestPhone && (
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
            <span className="font-medium">Phone:</span>
            <a
              href={`tel:${guestPhone}`}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 underline"
            >
              {guestPhone}
            </a>
          </div>
        )}
        {facebookLink && (
          <div className="flex items-center gap-1">
            <a
              href={facebookLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
              title="View Facebook Profile"
            >
              <ExternalLink className="w-3 h-3" />
              Facebook
            </a>
          </div>
        )}
        {validIdUrl && (
          <div className="flex items-center gap-1">
            <a
              href={validIdUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 underline"
              title="View Valid ID"
            >
              <ExternalLink className="w-3 h-3" />
              Valid ID
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
          {guestName}
        </span>
      </div>
      {guestEmail && (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <a
            href={`mailto:${guestEmail}`}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all"
          >
            {guestEmail}
          </a>
        </div>
      )}
      {guestPhone && (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <a
            href={`tel:${guestPhone}`}
            className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 underline"
          >
            {guestPhone}
          </a>
        </div>
      )}
      {facebookLink && (
        <div className="flex items-center gap-2">
          <a
            href={facebookLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            title="View Facebook Profile"
          >
            <ExternalLink className="w-3 h-3" />
            Facebook
          </a>
        </div>
      )}
      {validIdUrl && (
        <div className="flex items-center gap-2">
          <a
            href={validIdUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 underline"
            title="View Valid ID"
          >
            <ExternalLink className="w-3 h-3" />
            Valid ID
          </a>
        </div>
      )}
    </div>
  );
}
