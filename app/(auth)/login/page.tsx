"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loginWithEmailPassword,
  sendSignInLink,
  completeSignInWithEmailLink,
} from "@/lib/services/AuthService";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LandingHeader from "@/components/layout/landing/Header";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verificationMsg = searchParams?.get("verification") ?? null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [linkMode, setLinkMode] = useState(false);

  useEffect(() => {
    completeSignInWithEmailLink()
      .then((result) => {
        if (result) {
          router.push("/dashboard");
        }
      })
      .catch((err) => {
        console.error("Email link login error:", err);
      });
  }, [router]);

  const handleLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await loginWithEmailPassword(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  const handleSendLink = async () => {
    setError("");
    try {
      await sendSignInLink(email);
      alert("Check your email for the sign-in link!");
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  return (
    <>
      <LandingHeader />
      <div className="min-h-screen bg-gradient-to-b from-[#ff7f3017] to-brandBlack flex items-center justify-center text-brandWhite">
        <div className="w-full max-w-md bg-opacity-80 bg-gray-800 shadow-xl rounded-lg px-8 py-10">
          <h1 className="text-4xl font-extrabold text-brandOrange text-center mb-6">
            Login
          </h1>

          {verificationMsg === "sent" && (
            <p className="text-brandOrange bg-gray-700 p-3 rounded mb-4 text-center">
              We sent a verification link. Please check your email before
              logging in.
            </p>
          )}

          {error && (
            <p className="text-red-500 bg-gray-700 p-3 rounded mb-4 text-center font-semibold">
              {error}
            </p>
          )}

          {!linkMode ? (
            <form
              onSubmit={handleLoginPassword}
              className="flex flex-col space-y-4"
            >
              <Input
                className="bg-gray-900 text-white border border-gray-500 focus:outline-none focus:ring-2 focus:ring-brandOrange py-2 px-4 rounded"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                className="bg-gray-900 text-white border border-gray-500 focus:outline-none focus:ring-2 focus:ring-brandOrange py-2 px-4 rounded"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                className="bg-brandOrange hover:bg-orange-600 text-brandBlack font-semibold py-2 rounded text-lg"
                type="submit"
              >
                Login
              </Button>

              <div className="flex items-center justify-between text-sm mt-2">
                <Button
                  className="text-brandGray underline hover:text-brandOrange"
                  onClick={() => setLinkMode(true)}
                >
                  Sign in with Email Link
                </Button>
                <Link
                  href="/reset-password"
                  className="text-brandGray underline hover:text-brandOrange"
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="mt-4 text-center">
                <Link
                  href="/register"
                  className="text-brandOrange underline hover:text-orange-400 text-lg font-semibold"
                >
                  Don&apos;t have an account? Sign Up
                </Link>
              </div>
            </form>
          ) : (
            <div className="flex flex-col space-y-4">
              <Input
                className="bg-gray-900 text-white border border-gray-500 focus:outline-none focus:ring-2 focus:ring-brandOrange py-2 px-4 rounded"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                onClick={handleSendLink}
                className="bg-brandOrange hover:bg-orange-600 text-brandBlack font-semibold py-2 rounded text-lg"
              >
                Send Magic Link
              </Button>

              <div className="flex items-center justify-between text-sm mt-2">
                <Button
                  className="text-brandGray underline hover:text-brandOrange"
                  onClick={() => setLinkMode(false)}
                >
                  Login with Password
                </Button>
                <Link
                  href="/reset-password"
                  className="text-brandGray underline hover:text-brandOrange"
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="mt-4 text-center">
                <Link
                  href="/register"
                  className="text-brandOrange underline hover:text-orange-400 text-lg font-semibold"
                >
                  Don&apos;t have an account? Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
