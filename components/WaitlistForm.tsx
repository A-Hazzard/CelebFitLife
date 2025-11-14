"use client";

import { useState } from "react";

interface WaitlistFormProps {
  variant?: "mobile" | "desktop" | "inline";
}

export default function WaitlistForm({ variant = "desktop" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate email
      if (!email || !email.includes("@")) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }

      // Call API to create waitlist entry and get Stripe checkout URL
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

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to join waitlist. Please try again.";
      console.error("Waitlist signup error:", errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const inputClasses =
    variant === "mobile"
      ? "bg-gray-700 text-white px-4 py-3 rounded-lg text-sm"
      : variant === "inline"
      ? "flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg text-sm"
      : "flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg text-sm";

  const containerClasses =
    variant === "mobile"
      ? "flex flex-col gap-3"
      : variant === "inline"
      ? "flex flex-col md:flex-row gap-3 md:gap-4"
      : "flex gap-4";

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
          className="group bg-white text-black px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-orange-500 hover:text-white hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full md:w-auto"
        >
          {loading ? "Processing..." : "Join Waitlist"}
        </button>
      </div>
      {error && (
        <p className="mt-3 text-red-400 text-sm text-center">{error}</p>
      )}
      {variant === "mobile" || variant === "desktop" ? (
        <p className="text-gray-300 text-sm text-center mt-4">
          First live sessions drops soon. Reserve your spot now.
        </p>
      ) : null}
    </form>
  );
}

