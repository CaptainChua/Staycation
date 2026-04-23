'use client';

import React from 'react';
import GitWorkflowSidebar from './GitWorkflowSidebar';

interface GitWorkflowLayoutProps {
  children: React.ReactNode;
}

export default function GitWorkflowLayout({ children }: GitWorkflowLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <GitWorkflowSidebar />
      <main className="flex-1 flex justify-center">
        <div className="w-full max-w-5xl px-6 py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
