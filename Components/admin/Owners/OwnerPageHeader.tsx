"use client";

import type { ReactNode } from "react";

interface OwnerPageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

/** Matches the Owner Dashboard page header: full-width bordered card, title + muted subtitle, optional right actions. */
export default function OwnerPageHeader({ title, description, actions }: OwnerPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>
      {actions != null ? <div className="flex-shrink-0">{actions}</div> : null}
    </div>
  );
}
