"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle, Home } from "lucide-react";
import Image from "next/image";

const CELEB_IMAGES: Record<string, string> = {
  "Alex Sterling": "/celeb_a.png",
  "Elena Velez": "/celeb_b.png",
  "Marcus J.": "/celeb_c.png",
};

function OnboardingOptionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const verified = searchParams.get("verified");

  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showVerificationSuccess, setShowVerificationSuccess] =
    useState(verified === "true");

  useEffect(() => {
    if (!email) {
      router.push("/");
      return;
    }

    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `/api/user/status?email=${encodeURIComponent(email)}`
        );
        const data = await response.json();

        if (response.ok) {
          if (!data.isVerified) {
            router.push("/");
            return;
          }
          setVotedFor(data.votedFor || null);
        }
      } catch (err) {
        console.error("Failed to fetch user status", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [email, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full flex flex-col gap-8 text-center">
        {/* Verification Success */}
        {showVerificationSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-6 backdrop-blur-sm">
            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-400 w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Email Verified 🎉</h2>
            <p className="text-green-400">
              Your email has been successfully verified.
            </p>
          </div>
        )}

        {/* Vote Recorded */}
        {votedFor && (
          <div className="bg-white/10 border border-white/20 rounded-3xl p-8 backdrop-blur-sm">
            <h2 className="text-3xl font-bold mb-6">Vote Recorded!</h2>

            {CELEB_IMAGES[votedFor] && (
              <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-orange-500 mb-6 shadow-xl shadow-orange-500/30">
                <Image
                  src={CELEB_IMAGES[votedFor]}
                  alt={votedFor}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <p className="text-gray-300 text-lg mb-2">You voted for</p>
            <p className="text-3xl font-bold text-orange-400 mb-4">
              {votedFor}
            </p>

            <p className="text-gray-400 mb-6">
              We&apos;ll notify you when results are in and when sessions begin.
            </p>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm text-gray-400 hover:text-white underline"
            >
              {showPreview ? "Hide Candidates" : "Preview All Celebrities"}
            </button>
          </div>
        )}

        {/* Preview */}
        {showPreview && (
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(CELEB_IMAGES).map(([name, img]) => (
              <div
                key={name}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden mb-3">
                  <Image src={img} alt={name} fill className="object-cover" />
                </div>
                <p className="text-sm text-gray-300">{name}</p>
              </div>
            ))}
          </div>
        )}

        {/* Home Button */}
        <button
          onClick={() => {
            // Assuming 'sessionRecoveryEmail' is the key for session recovery in local storage
            localStorage.removeItem('sessionRecoveryEmail');
            router.push("/");
          }}
          className="mt-4 w-full py-4 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-xl flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Go Home
        </button>

        <p className="text-xs text-gray-500">
          Logged in as <span className="text-white">{email}</span>
        </p>
      </div>
    </div>
  );
}

export default function OnboardingOptions() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <OnboardingOptionsContent />
    </Suspense>
  );
}
