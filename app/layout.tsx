import type { Metadata } from "next";
import "./globals.css";
import { Proviers } from '@/Components/Providers'

export const metadata: Metadata = {
  title: "Staycation Haven",
  description: "Staycation Haven booking and admin portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Proviers>
          {children}
        </Proviers>
      </body>
    </html>
  );
}
