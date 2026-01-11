import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import UIProviders from "@/Components/UIProviders";
import { Proviers } from '@/Components/Providers'
import ConditionalLayout from "@/Components/ConditionalLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

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
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`} suppressHydrationWarning>
        <UIProviders>
          <Proviers>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </Proviers>
        </UIProviders>
      </body>
    </html>
  );
}
