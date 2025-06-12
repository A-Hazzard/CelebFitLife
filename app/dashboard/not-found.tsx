"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Home,
  BarChart3,
  Calendar,
  Settings,
  Dumbbell,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Dumbbell className="h-8 w-8 text-brandOrange" />
            <span className="text-2xl font-bold text-brandWhite">
              CelebFitLife Dashboard
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
              <BarChart3 className="h-12 w-12 text-brandOrange animate-pulse" />
              <div className="text-2xl md:text-3xl font-semibold text-brandWhite">
                Dashboard Page Not Found
              </div>
              <BarChart3 className="h-12 w-12 text-brandOrange animate-pulse" />
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-brandWhite mb-4">
              This dashboard feature is still in training
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              The dashboard page you&apos;re looking for doesn&apos;t exist or
              is currently unavailable. Let&apos;s get you back to managing your
              fitness journey!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/dashboard">
              <Button className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack font-semibold px-6 py-3 w-full sm:w-auto">
                <BarChart3 className="w-5 h-5 mr-2" />
                Main Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                className="border-brandOrange text-brandOrange hover:bg-brandOrange hover:text-brandBlack px-6 py-3 w-full sm:w-auto"
              >
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Dashboard Links */}
          <div className="border-t border-gray-800 pt-8">
            <h2 className="text-xl font-semibold text-brandWhite mb-4">
              Dashboard Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/dashboard/streams"
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-brandOrange transition-colors duration-200 group"
              >
                <Calendar className="h-8 w-8 text-brandOrange mb-2 mx-auto" />
                <div className="text-brandWhite font-medium group-hover:text-brandOrange">
                  Stream Management
                </div>
                <div className="text-gray-400 text-sm">
                  Manage your live streams
                </div>
              </Link>
              <Link
                href="/dashboard"
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-brandOrange transition-colors duration-200 group"
              >
                <BarChart3 className="h-8 w-8 text-brandOrange mb-2 mx-auto" />
                <div className="text-brandWhite font-medium group-hover:text-brandOrange">
                  Analytics
                </div>
                <div className="text-gray-400 text-sm">
                  View your performance
                </div>
              </Link>
              <Link
                href="/profile/edit"
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-brandOrange transition-colors duration-200 group"
              >
                <Settings className="h-8 w-8 text-brandOrange mb-2 mx-auto" />
                <div className="text-brandWhite font-medium group-hover:text-brandOrange">
                  Profile Settings
                </div>
                <div className="text-gray-400 text-sm">Update your profile</div>
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
