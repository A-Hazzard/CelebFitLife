"use client";

import { useState } from "react";

interface WaitlistFormProps {
  variant?: "mobile" | "desktop" | "inline" | "hero";
}

export default function WaitlistForm({ variant = "desktop" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setEmailSent(false);

    try {
      // Validate email
      if (!email || !email.includes("@")) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }

      // Call API to create waitlist entry and send verification email
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (data.success) {
        // Show success message instead of redirecting
        setEmailSent(true);
        setIsNewUser(data.data?.isNewUser ?? null);
        setLoading(false);
      } else {
        throw new Error(data.error || "Something went wrong");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to join waitlist. Please try again.";
      console.error("Waitlist signup error:", errorMessage);
      setError(errorMessage);
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
      {emailSent && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-green-400 text-sm text-center font-semibold mb-2">
            ✓ Verification email sent!
          </p>
          <p className="text-gray-300 text-sm text-center">
            {isNewUser === false ? (
              <>
                Please check your inbox at <span className="text-white font-medium">{email}</span> and click the verification link to verify your email address.
              </>
            ) : (
              <>
                Please check your inbox at <span className="text-white font-medium">{email}</span> and click the verification link to complete your registration.
              </>
            )}
          </p>
          <p className="text-gray-400 text-xs text-center mt-2">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
        </div>
      )}
      {!emailSent && (variant === "mobile" || variant === "desktop" || variant === "hero") ? (
        <p className="text-gray-300 text-sm text-center mt-4">
          First live sessions drops soon. Reserve your spot now.
        </p>
      ) : null}
    </form>
  );
}

