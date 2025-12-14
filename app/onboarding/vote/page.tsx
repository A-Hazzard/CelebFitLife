"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

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

function VotePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const [votingFor, setVotingFor] = useState<string | null>(null);
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
        // Redirect back to options page after successful vote
        router.push(`/onboarding/options?email=${encodeURIComponent(email)}`);
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

  if (!email || !verificationChecked) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }


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
            onClick={() => router.back()}
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
