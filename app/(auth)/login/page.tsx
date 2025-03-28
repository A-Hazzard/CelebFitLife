"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { handleLogin } from "@/lib/helpers/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Image from "next/image";
import fitImage from "@/public/fitness.png";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.6,
      ease: "easeOut",
    },
  }),
};

function LoginPageContent() {
  const router = useRouter();
  const { currentUser, setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      router.push("/dashboard");
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await handleLogin({ email, password });

    if (result.success && result.user) {
      setUser(result.user);
      if (result.user.role?.streamer) {
        router.push("/dashboard");
      } else router.push("/streaming");
    } else {
      setError(result.error || "Login failed. Please try again.");
    }

    setLoading(false);
  };

  if (currentUser) {
    return <div className="text-center text-orange-500">Redirecting...</div>;
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-black">
      {/* Left Section */}
      <div className="w-1/2 relative flex flex-col justify-center pl-32 pr-10 z-10 text-white">
        {/* Vertical Text (Left-Aligned & Vertical) */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute left-16 top-[10%] -translate-y-1/2 transform -rotate-90 origin-left text-9xl font-extrabold tracking-widest z-0"
        >
          {['F', 'I', 'T', '\u00A0', 'G', 'E', 'T'].map((char, index) => (
            <span 
              key={index} 
              className="block"
              style={{
                color: `rgba(255, 255, 255, ${1 - Math.abs(index - 3) * 0.15})`,
                lineHeight: '0.8'
              }}
            >
              {char}
            </span>
          ))}
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 pl-24 pr-10"
        >
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-white mb-4"
          >
            ← Back
          </button>

          <h2 className="text-xl text-gray-400 mb-1">
            Signing back into your account?
          </h2>
          <h1 className="text-5xl font-extrabold text-white mb-2 leading-tight">
            Login<span className="text-orange-500">.</span>
          </h1>
          <p className="mb-2 text-gray-400 text-sm">
            Don’t have an account?{" "}
            <Link href="/register" className="text-orange-500 font-semibold">
              Sign Up
            </Link>
          </p>
          <p className="text-xs text-orange-400 mb-6">
            Note: Free trial gets one celeb.
          </p>

          {error && (
            <p className="text-red-500 bg-gray-800 p-3 rounded mb-4 text-center font-semibold">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <div className="flex gap-4">
                <Input
                  placeholder="First Name"
                  className="flex-1 bg-[#111827] text-white border border-gray-700 px-4 py-3 rounded"
                />
                <Input
                  placeholder="Last Name"
                  className="flex-1 bg-[#111827] text-white border border-gray-700 px-4 py-3 rounded"
                />
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#111827] text-white border border-gray-700 px-4 py-3 rounded"
              />
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#111827] text-white border border-gray-700 px-4 py-3 rounded"
              />
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
            >
              <div className="flex gap-4 pt-2">
                <Button
                  type="button"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-full text-sm"
                >
                  Change Method
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full text-sm"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Sign in"}
                </Button>
              </div>
            </motion.div>
          </form>
        </motion.div>
      </div>

      {/* Right Section (Image) */}
      <div className="w-1/2 h-full relative">
        <Image
          src={fitImage}
          alt="Fitness woman"
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
