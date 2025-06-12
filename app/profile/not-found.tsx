"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Settings, Edit, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfileNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/profile" className="flex items-center space-x-2">
            <Dumbbell className="h-8 w-8 text-brandOrange" />
            <span className="text-2xl font-bold text-brandWhite">
              CelebFitLife Profile
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
              <User className="h-12 w-12 text-brandOrange animate-pulse" />
              <div className="text-2xl md:text-3xl font-semibold text-brandWhite">
                Profile Page Not Found
              </div>
              <User className="h-12 w-12 text-brandOrange animate-pulse" />
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-brandWhite mb-4">
              This profile page is taking a break
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              The profile page you&apos;re looking for doesn&apos;t exist or
              might have been moved. Let&apos;s get you back to managing your
              fitness profile!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/profile">
              <Button className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack font-semibold px-6 py-3 w-full sm:w-auto">
                <User className="w-5 h-5 mr-2" />
                View Profile
              </Button>
            </Link>
            <Link href="/profile/edit">
              <Button
                variant="outline"
                className="border-brandOrange text-brandOrange hover:bg-brandOrange hover:text-brandBlack px-6 py-3 w-full sm:w-auto"
              >
                <Edit className="w-5 h-5 mr-2" />
                Edit Profile
              </Button>
            </Link>
          </div>

          {/* Profile Options */}
          <div className="border-t border-gray-800 pt-8">
            <h2 className="text-xl font-semibold text-brandWhite mb-4">
              Profile Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/profile"
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-brandOrange transition-colors duration-200 group"
              >
                <User className="h-8 w-8 text-brandOrange mb-2 mx-auto" />
                <div className="text-brandWhite font-medium group-hover:text-brandOrange">
                  View Profile
                </div>
                <div className="text-gray-400 text-sm">
                  See your profile details
                </div>
              </Link>
              <Link
                href="/profile/edit"
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-brandOrange transition-colors duration-200 group"
              >
                <Edit className="h-8 w-8 text-brandOrange mb-2 mx-auto" />
                <div className="text-brandWhite font-medium group-hover:text-brandOrange">
                  Edit Profile
                </div>
                <div className="text-gray-400 text-sm">
                  Update your information
                </div>
              </Link>
              <Link
                href="/dashboard"
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-brandOrange transition-colors duration-200 group"
              >
                <Settings className="h-8 w-8 text-brandOrange mb-2 mx-auto" />
                <div className="text-brandWhite font-medium group-hover:text-brandOrange">
                  Dashboard
                </div>
                <div className="text-gray-400 text-sm">Manage your account</div>
              </Link>
            </div>
          </div>

          {/* Profile Tips */}
          <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-brandOrange mb-3">
              👤 Profile Tips
            </h3>
            <ul className="text-left text-gray-300 space-y-2">
              <li>
                • Complete your profile to get personalized workout
                recommendations
              </li>
              <li>• Add a profile picture to connect with the community</li>
              <li>• Set your fitness goals to track your progress</li>
              <li>• Update your preferences for better content suggestions</li>
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
