"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle, Crown, ArrowRight } from "lucide-react";

function PremiumOnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const [loading, setLoading] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);

  // Check verification status on mount
  useEffect(() => {
    if (!email) {
      router.push("/");
      return;
    }

    const checkVerification = async () => {
      try {
        const response = await fetch(`/api/user/status?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (response.ok && !data.isVerified) {
          // Redirect to landing page if not verified
          const redirectUrl = new URL('/', window.location.origin);
          redirectUrl.searchParams.set('error', 'verification_required');
          redirectUrl.searchParams.set('message', 'Please verify your email to access this page. Check your inbox for the verification link.');
          router.push(redirectUrl.toString());
          return;
        }
      } catch (error) {
        console.error("Error checking verification:", error);
      } finally {
        setVerificationChecked(true);
      }
    };

    checkVerification();
  }, [email, router]);

  if (!email || !verificationChecked) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/20 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-400/10 rounded-full blur-[150px]" />

      <div className="max-w-3xl w-full z-10">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                <Crown className="w-96 h-96 text-white" />
            </div>

          <div className="relative z-10">
            <button 
                onClick={() => window.history.back()}
                className="mb-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2 cursor-pointer px-2 py-1 hover:bg-white/5 rounded-lg w-fit"
            >
                ← Back
            </button>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 font-bold text-sm uppercase tracking-wider mb-6 border border-orange-500/20">
              <Crown className="w-4 h-4" />
              <span>Priority Access</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Train Like A <span className="text-orange-500">Star.</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-xl">
              Get immediate priority access to live sessions, exclusive content, and 10x voting power for the next celebrity trainer.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Early Access to Sessions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                     <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Exclusive Q&A Sessions</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                     <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="font-medium">10x Voting Power</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                     <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Verified Fan Badge</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full md:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-400 text-black font-bold text-lg rounded-xl transition-all transform hover:-translate-y-1 shadow-lg shadow-orange-500/40 flex items-center justify-center gap-2 group cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  Get Priority Access ($1)
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <p className="mt-4 text-sm text-gray-500">One-time payment. Secure checkout.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PremiumOnboarding() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <PremiumOnboardingContent />
    </Suspense>
  );
}
