import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CelebFitLife | Live Fitness Streaming",
  description:
    "Workout with your favorite celebrities and top fitness instructors on CelebFitLife. Join live, interactive sessions, engage with a vibrant community, and elevate your fitness journey.",
  openGraph: {
    title: "CelebFitLife | Live Fitness Streaming",
    description:
      "Join live, interactive workouts with top celebrities and fitness experts on CelebFitLife. Experience exclusive sessions and a vibrant community to transform your fitness journey.",
    url: "https://celebfitlife.com", // Replace with your actual URL
    siteName: "CelebFitLife",
    images: [
      {
        url: "https://celebfitlife.vercel.app/og-image.jpg", // Replace with your actual logo/image URL
        width: 1200,
        height: 630,
        alt: "CelebFitLife - Live Fitness Streaming",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster position="top-right" expand={false} richColors />
        {children}
      </body>
    </html>
  );
}
