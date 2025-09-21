import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CelebFIT - Train with Your Idol Live",
  description: "Be part of the world's first live celebrity training experience. Limited sports. No reruns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased bg-black text-white`}>
        {children}
      </body>
    </html>
  );
}
