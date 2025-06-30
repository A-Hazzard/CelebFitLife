"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Code, AlertTriangle, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApiNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Dumbbell className="h-8 w-8 text-brandOrange" />
            <span className="text-2xl font-bold text-brandWhite">
              CelebFitLife API
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
              <Code className="h-12 w-12 text-brandOrange animate-pulse" />
              <div className="text-2xl md:text-3xl font-semibold text-brandWhite">
                API Endpoint Not Found
              </div>
              <Code className="h-12 w-12 text-brandOrange animate-pulse" />
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-brandWhite mb-4">
              This API endpoint is out of service
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              The API endpoint you&apos;re trying to access doesn&apos;t exist
              or has been moved. This might be a development error or an
              outdated API call.
            </p>
          </div>

          {/* Error Details */}
          <div className="mb-8 bg-gray-900 border border-red-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-red-400">
                API Error Details
              </h3>
            </div>
            <div className="text-left text-gray-300 space-y-2">
              <p>
                <strong>Status:</strong> 404 Not Found
              </p>
              <p>
                <strong>Message:</strong> The requested API endpoint does not
                exist
              </p>
              <p>
                <strong>Timestamp:</strong> {new Date().toISOString()}
              </p>
            </div>
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
                <Code className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </div>

          {/* API Information */}
          <div className="border-t border-gray-800 pt-8">
            <h2 className="text-xl font-semibold text-brandWhite mb-4">
              Available API Endpoints
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h4 className="text-brandOrange font-medium mb-2">
                  Authentication
                </h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• POST /api/auth/login</li>
                  <li>• POST /api/auth/register</li>
                  <li>• GET /api/auth/check-username</li>
                </ul>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h4 className="text-brandOrange font-medium mb-2">Data</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• GET /api/streamers</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Developer Tips */}
          <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-brandOrange mb-3">
              🔧 Developer Tips
            </h3>
            <ul className="text-left text-gray-300 space-y-2">
              <li>• Check the API endpoint URL for typos</li>
              <li>• Verify the HTTP method (GET, POST, PUT, DELETE)</li>
              <li>• Ensure proper authentication headers are included</li>
              <li>• Check if the API version is correct</li>
              <li>• Review the API documentation for valid endpoints</li>
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
