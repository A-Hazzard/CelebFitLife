"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle, Crown, ArrowRight } from "lucide-react";

const PRICE = 10;

function PremiumOnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push("/");
    }
  }, [email, router]);

  const handleUpgrade = async () => {
    if (!email) return;
    setLoading(true);

    try {
      const response = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Error initiating checkout.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setShowVerifyModal(true);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/20 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-400/10 rounded-full blur-[150px]" />

      <div className="max-w-3xl w-full z-10">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
            <Crown className="w-96 h-96 text-white" />
          </div>

          <div className="relative z-10">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 font-bold text-sm uppercase tracking-wider mb-6 border border-orange-500/20">
              <Crown className="w-4 h-4" />
              <span>Priority Access</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Train Like A <span className="text-orange-500">Star.</span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-xl">
              Get immediate priority access to live sessions, exclusive content,
              and <strong>10× voting power</strong>.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {[
                "Early Access to Sessions",
                "Exclusive Q&A Sessions",
                "10× Voting Power",
                "Verified Fan Badge",
              ].map((perk) => (
                <div key={perk} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{perk}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full px-8 py-4 bg-orange-500 hover:bg-orange-400 text-black font-bold text-lg rounded-xl transition-all transform hover:-translate-y-1 shadow-lg shadow-orange-500/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? "Processing..." : `Get Priority Access ($${PRICE})`}
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleSkip}
              className="mt-4 w-full text-gray-400 hover:text-white text-sm underline"
            >
              Skip for now
            </button>

            <p className="mt-4 text-sm text-gray-500 text-center">
              One-time payment. Secure checkout.
            </p>
          </div>
        </div>
      </div>

      {/* VERIFY EMAIL REMINDER MODAL */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 text-center relative">
            {/* Close button (X) */}
            <button
              onClick={() => setShowVerifyModal(false)}
              className="absolute top-2 right-2 text-white text-xl"
            >
              &times; {/* This is the X symbol */}
            </button>

            <h2 className="text-2xl font-bold mb-3">
              One last step ✉️
            </h2>

            <p className="text-gray-300 mb-6">
              Please verify your email to confirm your vote and secure your spot.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  // Remove session recovery email from localStorage
                  localStorage.removeItem('sessionRecoveryEmail');
                  // Clear navigation history to prevent NavigationRestorer from redirecting back
                  sessionStorage.removeItem('celebfit_last_path');
                  // Use window.location.href for direct navigation without Next.js redirects
                  window.location.href = "/";
                }}
                className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-xl transition-all"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function PremiumOnboarding() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <PremiumOnboardingContent />
    </Suspense>
  );
}
