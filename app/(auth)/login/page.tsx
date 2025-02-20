"use client";

import React, { useState, Suspense } from "react";
import LandingHeader from "@/components/layout/landing/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { handleLogin } from "@/lib/helpers/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

function LoginPageContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const result = await handleLogin({ email, password });
    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Login failed");
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
          {error && (
            <p className="text-red-500 bg-gray-700 p-3 rounded mb-4 text-center font-semibold">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              className="bg-gray-900 text-white border border-gray-500 focus:outline-none focus:ring-2 focus:ring-brandOrange py-2 px-4 rounded"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              className="bg-gray-900 text-white border border-gray-500 focus:outline-none focus:ring-2 focus:ring-brandOrange py-2 px-4 rounded"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              className="bg-brandOrange hover:bg-orange-600 text-brandBlack font-semibold py-2 rounded text-lg w-full"
              type="submit"
            >
              Login
            </Button>
            <div className="mt-4 text-center">
              <Link
                href="/register"
                className="text-brandOrange underline hover:text-orange-400 text-lg font-semibold"
              >
                Don&apos;t have an account? Sign Up
              </Link>
            </div>
          </form>
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
