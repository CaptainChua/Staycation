'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import MessageButton from './MessageButton';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDocumentationPage = pathname?.startsWith('/documentation');
  const isAdminPage = pathname?.startsWith('/admin');

  // Hide navbar and message button for documentation and admin pages
  if (isDocumentationPage || isAdminPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <MessageButton />
    </>
  );
}
