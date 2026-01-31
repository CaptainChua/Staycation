import type { Metadata } from "next";
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
      { url: '/favicon-32x32v2.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16 32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "14.63756",
                "longitude": "121.03598"
              },
              "openingHours": "Mo-Su 06:00-18:00",
              "priceRange": "1999 - 2999",
              "sameAs": [
                "https://www.facebook.com/staycationhavenph",
                "https://www.instagram.com/staycationhavenph",
                "https://www.tiktok.com/@staycationhavenph"
              ],
              "services": "Short-term rentals, vacation stays, luxury accommodations, family getaways, couple retreats",
              "areaServed": {
                "@type": "Country",
                "name": "Philippines"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Accommodation Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Accommodation",
                      "name": "Luxury Staycation Packages",
                      "description": "Premium short-term accommodation with modern amenities"
                    }
                  },
                  {
                    "@type": "Offer", 
                    "itemOffered": {
                      "@type": "Accommodation",
                      "name": "Family Vacation Rentals",
                      "description": "Spacious accommodations perfect for families"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Accommodation", 
                      "name": "Business Travel Stays",
                      "description": "Comfortable accommodations for business travelers"
                    }
                  }
                ]
              }
            }),
          }}
        />
        
        {/* Additional structured data for Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Staycation Haven Philippines",
              "url": "https://www.staycationhavenph.com",
              "description": "Discover premium staycation havens across the Philippines. Book luxurious short-term stays, vacation rentals, and getaways.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.staycationhavenph.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Staycation Haven Philippines",
                "url": "https://www.staycationhavenph.com"
              }
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
