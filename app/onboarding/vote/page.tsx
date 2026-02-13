"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useState } from "react";
import Image from "next/image";
import { Loader2, Mail } from "lucide-react";

const CELEBS = [
  {
    id: "celeb_a",
    name: "Alex Sterling",
    role: "Action Star / CrossFit",
    image: "/celeb_a.png",
  },
  {
    id: "celeb_b",
    name: "Elena Velez",
    role: "Pop Icon / Pilates",
    image: "/celeb_b.png",
  },
  {
    id: "celeb_c",
    name: "Marcus J.",
    role: "Pro Athlete / Sprint",
    image: "/celeb_c.png",
  },
];

const CELEB_IMAGES: Record<string, string> = {
  "Alex Sterling": "/celeb_a.png",
  "Elena Velez": "/celeb_b.png",
  "Marcus J.": "/celeb_c.png",
};

function VotePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const [votingFor, setVotingFor] = useState<string | null>(null);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    if (!email) {
      router.push("/");
      return;
    }

    // Fetch user status on page load
    const fetchUserStatus = async () => {
      try {
        const response = await fetch(`/api/user/status?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (data.votedFor) {
          setVotedFor(data.votedFor);
        }

        setIsVerified(data.isVerified ?? false);
      } catch (error) {
        console.error("Failed to fetch user status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStatus();
  }, [email, router]);


  const handleVote = async (celebId: string) => {
    if (!email) return;

    setVotingFor(celebId);

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, candidateId: celebId }),
      });

      const data = await response.json();

      if (data.success) {
        // After Vote → Premium Upsell
        router.push(`/onboarding/premium?email=${encodeURIComponent(email)}`);
      } else {
        alert(data.error || "Failed to vote");
      }
    } catch (error) {
      console.error(error);
      alert("Error voting");
    } finally {
      setVotingFor(null);
    }
  };




  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0a0a0a] via-[#050505] to-[#0a0a0a] text-white flex flex-col items-center p-4 md:p-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-orange-500/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-6xl w-full flex flex-col items-center gap-12 mt-10 relative z-10">
        <div className="text-center space-y-4 relative w-full flex flex-col items-center justify-center">
          <button
            onClick={() => {
              if (votedFor) {
                // If already voted, go home and clear storage to prevent redirects
                localStorage.removeItem('sessionRecoveryEmail');
                sessionStorage.removeItem('celebfit_last_path');
                window.location.href = "/";
              } else {
                // Otherwise, use normal back navigation
                router.back();
              }
            }}
            className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-lg"
          >
            ← Back
          </button>
          <h1 className="text-4xl md:text-6xl font-bold">
            Vote for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 animate-gradient">Next Trainer</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Your voice matters. Select the celebrity you want to see lead the first live session.
          </p>
        </div>

        {/* Email Verification Reminder - Show if not verified */}
        {!loading && !isVerified && votedFor && (
          <div className="w-full bg-orange-500/10 border-2 border-orange-500/30 rounded-2xl p-6 backdrop-blur-sm flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Mail className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-orange-400 mb-2">Verify Your Email to Confirm Your Vote</h3>
              <p className="text-gray-300 text-sm">
                We sent a verification link to <span className="font-semibold text-white">{email}</span>.
                Please check your inbox and click the link to confirm your vote and secure your spot.
              </p>
            </div>
          </div>
        )}

        {/* Vote Recorded Section - Show if already voted */}
        {votedFor && (
          <div className="w-full bg-white/10 border border-white/20 rounded-3xl p-8 backdrop-blur-sm">
            <h2 className="text-3xl font-bold mb-6 text-center">Vote Recorded!</h2>

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

            <p className="text-gray-300 text-lg mb-2 text-center">You voted for</p>
            <p className="text-3xl font-bold text-orange-400 mb-4 text-center">
              {votedFor}
            </p>

            <p className="text-gray-400 mb-6 text-center">
              We&apos;ll notify you when results are in and when sessions begin.
            </p>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm text-gray-400 hover:text-white underline mx-auto block"
            >
              {showPreview ? "Hide Candidates" : "Preview All Celebrities"}
            </button>
          </div>
        )}

        {/* Preview Section - Show when user clicks preview */}
        {showPreview && (
          <div className="w-full grid grid-cols-3 gap-4">
            {Object.entries(CELEB_IMAGES).map(([name, img]) => (
              <div
                key={name}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden mb-3">
                  <Image src={img} alt={name} fill className="object-cover" />
                </div>
                <p className="text-sm text-gray-300 text-center">{name}</p>
              </div>
            ))}
          </div>
        )}

        {/* Voting Grid - Only show if not voted yet */}
        {!votedFor && !loading && (
          <>
            <div className="grid md:grid-cols-3 gap-8 w-full">
              {CELEBS.map((celeb) => (
                <div key={celeb.id} className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 flex flex-col transform hover:-translate-y-2">
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/10 group-hover:to-transparent rounded-3xl transition-all duration-300 pointer-events-none" />

                  <div className="relative aspect-[3/4] w-full overflow-hidden">
                    <Image
                      src={celeb.image}
                      alt={celeb.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-bold drop-shadow-lg">{celeb.name}</h3>
                      <p className="text-gray-200 text-sm drop-shadow-md">{celeb.role}</p>
                    </div>
                  </div>

                  <div className="p-6">
                    <button
                      onClick={() => handleVote(celeb.id)}
                      disabled={!!votingFor}
                      className="group/btn relative w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-black font-bold overflow-hidden transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:from-orange-400 hover:to-orange-500 hover:shadow-lg hover:shadow-orange-500/50 transform hover:scale-105"
                    >
                      {/* Flame effect overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-300/30 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-in-out" />

                      {/* Animated flame particles on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">
                        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-orange-300 rounded-full blur-sm animate-flame" style={{ animationDelay: '0s' }} />
                        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-orange-400 rounded-full blur-sm animate-flame" style={{ animationDelay: '0.2s' }} />
                        <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-orange-200 rounded-full blur-sm animate-flame" style={{ animationDelay: '0.4s' }} />
                      </div>

                      <span className="relative z-10">
                        {votingFor === celeb.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Casting Vote...
                          </>
                        ) : (
                          <>
                            Vote
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10 rounded-2xl border border-orange-500/20 backdrop-blur-sm">
              <p className="text-sm text-gray-300 max-w-md text-center">
                <span className="text-orange-400 font-semibold">*Premium members</span> get <span className="text-orange-500 font-bold">10x voting power</span>. Upgrade anytime to boost your impact.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <VotePageContent />
    </Suspense>
  );
}

