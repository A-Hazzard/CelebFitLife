"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { handleLogin } from "@/lib/helpers/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Image from "next/image";
import fitImage from "@/public/fitness.png";
import { normalizeUser } from "@/lib/utils/userUtils";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center py-10 px-4">
      <LoginPageContent />
    </main>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const { currentUser, setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const isStreamer = currentUser.role?.streamer === true;
      if (isStreamer) {
        router.push("/dashboard");
      } else {
        router.push("/streaming");
      }
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await handleLogin({ email, password });
      if (result.success && result.user) {
        const userData = normalizeUser(result.user);
        setUser(userData);
        const isStreamer = result.user.role?.streamer === true;
        if (isStreamer) {
          router.push("/dashboard");
        } else {
          router.push("/streaming");
        }
      } else {
        setError(result.error || "Login failed. Please try again.");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    return <div className="text-center text-orange-500">Redirecting...</div>;
  }

  return (
    <motion.div
      className="max-w-5xl w-full mx-auto px-4"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
    >
      <div className="w-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-b from-gray-800 to-gray-900 backdrop-blur-lg border border-gray-700">
        <div className="flex flex-col md:flex-row">
          {/* Left Side - Image, Branding, and Vertical Text */}
          <div className=" flex-none md:w-2/5 relative overflow-hidden aspect-video md:aspect-auto h-[220px] sm:h-[260px] md:h-auto min-h-[220px] md:min-h-[400px] lg:min-h-[500px] xl:min-h-[600px]">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
            <Image
              src={fitImage.src}
              alt="Fitness"
              fill
              className="absolute inset-0 object-cover"
              priority
            />
            {/* Vertical GET FIT text - perfectly centered, larger on lg+ */}
            <div className="absolute left-2 sm:left-4 md:left-6 lg:left-10 top-1/2 lg:top-[55%] -translate-y-1/2 lg:-translate-y-[55%] transform -rotate-90 origin-left z-20 hidden sm:block select-none pointer-events-none">
              <span className="block text-4xl sm:text-6xl md:text-[70px] lg:text-[90px] xl:text-[110px] leading-none font-extrabold tracking-widest text-white/10" style={{letterSpacing: '0.2em'}}>GET FIT</span>
            </div>
            <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 md:p-8 lg:p-12 z-30">
              <Link 
                href="/" 
                className="text-white flex items-center text-xs sm:text-sm hover:text-orange-500 transition w-max group"
              >
                ← Back to home
              </Link>
              <div className="mb-4 sm:mb-8">
                <h2 className="text-orange-500 font-bold text-3xl mb-3">CelebFit Life</h2>
                <p className="text-gray-300 text-sm max-w-xs leading-relaxed">
                  Welcome back! Log in to join live workouts and connect with your favorite fitness streamers.
                </p>
              </div>
            </div>
          </div>
          {/* Right Side - Login Form */}
          <div className="flex-none md:w-3/5 lg:w-1/2 max-w-lg p-4 sm:p-8 md:p-10 flex flex-col justify-center min-h-[220px] md:min-h-[400px] lg:min-h-[500px] xl:min-h-[600px]">
            <div className="mb-8">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-3xl font-bold text-white mb-3"
              >
                Login
              </motion.h1>
              <p className="text-gray-400 text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-orange-500 hover:underline">
                  Sign Up
                </Link>
              </p>
              <p className="text-xs text-orange-400 mt-2">
                Note: Free trial gets one celeb.
              </p>
            </div>
            {error && (
              <p className="text-red-500 bg-gray-800 p-3 rounded mb-4 text-center font-semibold">
                {error}
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md w-full">
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#111827] text-white border border-gray-700 px-4 py-3 rounded text-sm max-w-md w-full"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#111827] text-white border border-gray-700 px-4 py-3 rounded text-sm max-w-md w-full"
              />
              <div className="flex items-center justify-between">
                <Link href="/reset-password" className="text-xs text-orange-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded transition text-base max-w-md w-full"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
