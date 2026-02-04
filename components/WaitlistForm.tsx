"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface WaitlistFormProps {
  variant?: "mobile" | "desktop" | "inline" | "hero";
}

export default function WaitlistForm({ variant = "desktop" }: WaitlistFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Basic validation
      if (!email || !email.includes("@")) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }

      // Save email ONLY (no verification yet)
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Something went wrong");
      }

      // 🚀 IMMEDIATELY GO TO VOTING
      router.push(`/onboarding/vote?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to join waitlist. Please try again.";
      console.error("Waitlist signup error:", message);
      setError(message);
      setLoading(false);
    }
  };

  const sharedInput =
    "text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  const inputClasses = (() => {
    switch (variant) {
      case "mobile":
        return `${sharedInput} bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-base`;
      case "inline":
        return `${sharedInput} flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm`;
      case "hero":
        return `${sharedInput} flex-1 bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-base`;
      default:
        return `${sharedInput} flex-1 bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-base`;
    }
  })();

  const containerClasses = (() => {
    switch (variant) {
      case "mobile":
        return "flex flex-col gap-3";
      case "inline":
        return "flex flex-col md:flex-row gap-3 md:gap-4";
      case "hero":
        return "flex flex-col sm:flex-row gap-3 sm:gap-4";
      default:
        return "flex flex-col sm:flex-row gap-3 sm:gap-4";
    }
  })();

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={containerClasses}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          className={inputClasses}
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer group w-full md:w-auto bg-gradient-to-r from-orange-500 to-orange-400 text-black font-semibold px-6 py-3 rounded-xl text-base shadow-lg shadow-orange-500/40 transition-all duration-300 hover:from-orange-400 hover:to-orange-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {loading ? "Processing..." : "Join Waitlist"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-red-400 text-sm text-center">{error}</p>
      )}

      <p className="text-gray-300 text-sm text-center mt-4">
        First live session drops soon. Reserve your spot now.
      </p>
    </form>
  );
}
