"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Search, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Dumbbell className="h-8 w-8 text-brandOrange" />
            <span className="text-2xl font-bold text-brandWhite">
              CelebFitLife
            </span>
          </Link>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-brandOrange text-brandOrange hover:bg-brandOrange hover:text-brandBlack"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl mx-auto">
          {/* 404 Animation */}
          <div className="mb-8">
            <div className="text-8xl md:text-9xl font-bold text-brandOrange mb-4 animate-bounce">
              404
            </div>
            <div className="flex justify-center items-center space-x-2 mb-6">
              <Dumbbell className="h-12 w-12 text-brandOrange animate-pulse" />
              <div className="text-2xl md:text-3xl font-semibold text-brandWhite">
                Workout Not Found
              </div>
              <Dumbbell className="h-12 w-12 text-brandOrange animate-pulse" />
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-brandWhite mb-4">
              Oops! This page took a rest day
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved. Don&apos;t worry, there are plenty of other workouts to
              explore!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/">
              <Button className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack font-semibold px-6 py-3 w-full sm:w-auto">
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="border-brandOrange text-brandOrange hover:bg-brandOrange hover:text-brandBlack px-6 py-3 w-full sm:w-auto"
              >
                <Search className="w-5 h-5 mr-2" />
                Browse Workouts
              </Button>
            </Link>
          </div>

          {/* Popular Links */}
          <div className="border-t border-gray-800 pt-8">
            <h2 className="text-xl font-semibold text-brandWhite mb-4">
              Popular Destinations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Link
                href="/streaming"
                className="text-gray-300 hover:text-brandOrange transition-colors duration-200"
              >
                Live Streams
              </Link>
              <Link
                href="/feeds"
                className="text-gray-300 hover:text-brandOrange transition-colors duration-200"
              >
                Workout Feeds
              </Link>
              <Link
                href="/profile"
                className="text-gray-300 hover:text-brandOrange transition-colors duration-200"
              >
                Your Profile
              </Link>
              <Link
                href="/features"
                className="text-gray-300 hover:text-brandOrange transition-colors duration-200"
              >
                Features
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 p-4 text-center text-gray-400">
        <p>&copy; 2024 CelebFitLife. All rights reserved.</p>
      </footer>
    </div>
  );
}
