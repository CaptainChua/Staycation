import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from '@/Components/Providers'

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
  metadataBase: new URL('https://www.staycationhavenph.com'),
  title: {
    default: "Staycation Haven PH | Premium Short-Term Stays & Vacation Rentals",
    template: "Staycation Haven PH | %s"
  },
  description: "Discover premium staycation havens across the Philippines. Book luxurious short-term stays, vacation rentals, and getaways with modern amenities. Perfect for couples, families, and business travelers.",
  keywords: [
    "staycation Philippines",
    "short-term rentals Philippines",
    "staycation quezon city",
    "staycation haven ph", 
    "staycation haven", 
    "staycation qc", 
    "vacation rentals",
    "luxury stays",
    "holiday homes",
    "temporary accommodation",
    "Manila staycation",
    "Quezon city vacation rentals",
    "Quezon city stays",
    "Quezon city getaways",
    "condotel booking",
    "apartment rentals",
    "beachfront stays",
    "city view accommodations",
    "family vacation",
    "couple retreat",
    "business travel accommodation"
  ],
  authors: [{ name: "Staycation Haven" }],
  creator: "Staycation Haven",
  publisher: "Staycation Haven",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': 150,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.staycationhavenph.com',
    title: 'Staycation Haven Philippines | Premium Short-Term Stays & Vacation Rentals',
    description: 'Discover premium staycation havens across the Philippines. Book luxurious short-term stays, vacation rentals, and getaways with modern amenities.',
    siteName: 'Staycation Haven Philippines',
    images: [
      {
        url: '/Images/bg.jpg',
        width: 1200,
        height: 630,
        alt: 'Staycation Haven Philippines - Premium Vacation Rentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Staycation Haven Philippines | Premium Short-Term Stays & Vacation Rentals',
    description: 'Discover premium staycation havens across the Philippines. Book luxurious short-term stays, vacation rentals, and getaways.',
    images: ['/Images/bg.jpg'],
  },
  alternates: {
    canonical: 'https://www.staycationhavenph.com',
    languages: {
      'en-US': 'https://www.staycationhavenph.com',
      'en-PH': 'https://www.staycationhavenph.com',
    },
  },
  category: 'travel',
  classification: 'Travel and Tourism',
  referrer: 'origin-when-cross-origin',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16v2.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32v2.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-196x196v2.png', sizes: '196x196', type: 'image/png' },
      { url: '/android-chrome-512x512v2.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-iconv2.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const travelAgencySchema = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "name": "Staycation Haven Philippines",
  "description": "Premium short-term stays and vacation rentals across the Philippines",
  "url": "https://www.staycationhavenph.com",
  "logo": "https://www.staycationhavenph.com/haven_logo.png",
  "image": "https://www.staycationhavenph.com/Images/bg.jpg",
  "telephone": "+639615718391",
  "email": "info@staycationhavenph.com",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "PH",
    "addressLocality": "M Place South Triangle Tower D, Panay Ave, Diliman, Quezon City, 1103 Metro Manila",
    "addressRegion": "Philippines"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": "14.63756", "longitude": "121.03598" },
  "openingHours": "Mo-Su 06:00-18:00",
  "priceRange": "1999 - 2999",
  "sameAs": [
    "https://www.facebook.com/staycationhavenph",
    "https://www.instagram.com/staycationhavenph",
    "https://www.tiktok.com/@staycationhavenph"
  ],
  "areaServed": { "@type": "Country", "name": "Philippines" }
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Staycation Haven Philippines",
  "url": "https://www.staycationhavenph.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.staycationhavenph.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon-16x16v2.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32v2.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/android-chrome-196x196v2.png" sizes="196x196" type="image/png" />
        <link rel="icon" href="/android-chrome-512x512v2.png" sizes="512x512" type="image/png" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" type="image/png" sizes="180x180" href="/apple-touch-iconv2.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <Script
          id="travel-agency-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(travelAgencySchema) }}
        />
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}