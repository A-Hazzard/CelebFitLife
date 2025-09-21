import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/seo/schema";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CelebFitLife - Train with Celebrity Trainers Live",
    template: "%s | CelebFitLife",
  },
  description: "Join exclusive live fitness sessions with celebrity trainers and athletes. Real-time, interactive workouts with your fitness idols. No pre-recorded content - every session is live and exclusive.",
  keywords: [
    "celebrity fitness",
    "live workout sessions",
    "celebrity trainers",
    "interactive fitness",
    "online fitness classes",
    "celebrity workout",
    "live fitness streaming",
    "personal training online",
    "celebrity personal trainer",
    "fitness platform",
    "live fitness sessions",
    "celebrity athlete training",
    "real-time fitness",
    "exclusive workout sessions",
    "celebrity fitness app"
  ],
  authors: [{ name: "CelebFitLife Team" }],
  creator: "CelebFitLife",
  publisher: "CelebFitLife",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://celebfitlife.com"),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-US",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://celebfitlife.com",
    title: "CelebFitLife - Train with Celebrity Trainers Live",
    description: "Join exclusive live fitness sessions with celebrity trainers and athletes. Real-time, interactive workouts with your fitness idols.",
    siteName: "CelebFitLife",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "CelebFitLife - Train with Celebrity Trainers Live",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@celebfitlife",
    creator: "@celebfitlife",
    title: "CelebFitLife - Train with Celebrity Trainers Live",
    description: "Join exclusive live fitness sessions with celebrity trainers and athletes. Real-time, interactive workouts with your fitness idols.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  category: "fitness",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();

  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="shortcut icon" href="/logo.png" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body className={`${geist.variable} antialiased bg-black text-white`}>
        {children}
      </body>
    </html>
  );
}
