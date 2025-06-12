"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Video, Play, Calendar, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StreamingNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/streaming" className="flex items-center space-x-2">
            <Dumbbell className="h-8 w-8 text-brandOrange" />
            <span className="text-2xl font-bold text-brandWhite">
              CelebFitLife Streaming
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
              <Video className="h-12 w-12 text-brandOrange animate-pulse" />
              <div className="text-2xl md:text-3xl font-semibold text-brandWhite">
                Stream Not Found
              </div>
              <Video className="h-12 w-12 text-brandOrange animate-pulse" />
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-brandWhite mb-4">
              This stream has ended or doesn&apos;t exist
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              The live stream you&apos;re looking for might have ended, been
              moved, or never existed. Don&apos;t worry, there are plenty of
              other amazing workouts waiting for you!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/streaming">
              <Button className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack font-semibold px-6 py-3 w-full sm:w-auto">
                <Play className="w-5 h-5 mr-2" />
                Browse Live Streams
              </Button>
            </Link>
            <Link href="/feeds">
              <Button
                variant="outline"
                className="border-brandOrange text-brandOrange hover:bg-brandOrange hover:text-brandBlack px-6 py-3 w-full sm:w-auto"
              >
                <Video className="w-5 h-5 mr-2" />
                Watch Replays
              </Button>
            </Link>
          </div>

          {/* Streaming Options */}
          <div className="border-t border-gray-800 pt-8">
            <h2 className="text-xl font-semibold text-brandWhite mb-4">
              Explore Streaming Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/streaming"
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-brandOrange transition-colors duration-200 group"
              >
                <Play className="h-8 w-8 text-brandOrange mb-2 mx-auto" />
                <div className="text-brandWhite font-medium group-hover:text-brandOrange">
                  Live Streams
                </div>
                <div className="text-gray-400 text-sm">
                  Join active workouts
                </div>
              </Link>
              <Link
                href="/feeds"
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-brandOrange transition-colors duration-200 group"
              >
                <Video className="h-8 w-8 text-brandOrange mb-2 mx-auto" />
                <div className="text-brandWhite font-medium group-hover:text-brandOrange">
                  Workout Replays
                </div>
                <div className="text-gray-400 text-sm">Watch past sessions</div>
              </Link>
              <Link
                href="/dashboard/streams"
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-brandOrange transition-colors duration-200 group"
              >
                <Calendar className="h-8 w-8 text-brandOrange mb-2 mx-auto" />
                <div className="text-brandWhite font-medium group-hover:text-brandOrange">
                  Schedule Stream
                </div>
                <div className="text-gray-400 text-sm">
                  Create your own stream
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-brandOrange mb-3">
              💡 Quick Tips
            </h3>
            <ul className="text-left text-gray-300 space-y-2">
              <li>• Check if the stream URL is correct</li>
              <li>
                • The stream might have ended - try browsing active streams
              </li>
              <li>• Some streams require subscription access</li>
              <li>• Bookmark your favorite streamers to get notified</li>
            </ul>
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
