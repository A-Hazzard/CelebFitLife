"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Star, Vote, CheckCircle } from "lucide-react";
import Image from "next/image";

const CELEB_IMAGES: Record<string, string> = {
  "Alex Sterling": "/celeb_a.png",
  "Elena Velez": "/celeb_b.png",
  "Marcus J.": "/celeb_c.png"
};

function OnboardingOptionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const verified = searchParams.get("verified");
  
  const [userStatus, setUserStatus] = useState<'new' | 'paid' | 'voted' | 'existing_unpaid' | null>(null);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(verified === 'true');

  useEffect(() => {
    if (!email) return;
    
    const fetchUserStatus = async () => {
      try {
        const response = await fetch(`/api/user/status?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (response.ok) {
          setUserStatus(data.status);
          setVotedFor(data.votedFor);
          setIsVerified(data.isVerified || false);
          
          // If user is not verified, redirect to landing page
          if (!data.isVerified) {
            const redirectUrl = new URL('/', window.location.origin);
            redirectUrl.searchParams.set('error', 'verification_required');
            redirectUrl.searchParams.set('message', 'Please verify your email to access this page. Check your inbox for the verification link.');
            router.push(redirectUrl.toString());
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching user status:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserStatus();
  }, [email, router]);

  if (!email) {
    if (typeof window !== "undefined") router.push("/");
    return null;
  }

  if (loading || !isVerified) {
    return (
      <div className="min-h-screen w-full bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Separate disabled states for each button
  const isPriorityAccessDisabled = userStatus === 'paid';
  const isVoteDisabled = userStatus === 'voted' || !!votedFor;

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl w-full flex flex-col items-center gap-12">
        <div className="text-center space-y-4 w-full relative flex flex-col items-center justify-center">
           <button 
            onClick={() => router.push("/")}
            className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors flex items-center gap-2 cursor-pointer px-4 py-2 hover:bg-white/5 rounded-lg"
          >
            ← Back
          </button>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Choose Your Path
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            You&apos;re on the list. Now select how you want to experience CelebFitLife.
          </p>
        </div>

        {/* Verification Success Message */}
        {showVerificationSuccess && (
          <div className="w-full max-w-2xl bg-green-500/10 border border-green-500/20 rounded-3xl p-6 text-center backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
              <CheckCircle className="text-white w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-green-400 text-lg">Your email has been successfully verified. You can now proceed.</p>
            <button
              onClick={() => setShowVerificationSuccess(false)}
              className="mt-4 text-gray-400 hover:text-white text-sm underline transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 w-full">
          {/* Option A: Priority Access */}
          <button 
            onClick={() => !isPriorityAccessDisabled && router.push(`/onboarding/premium?email=${email}`)}
            disabled={isPriorityAccessDisabled}
            className={`group relative flex flex-col items-center p-8 rounded-3xl bg-white/5 border border-white/10 text-left h-full transition-all duration-300 ${
              isPriorityAccessDisabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:border-orange-500/50 hover:bg-white/10 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/20'
            }`}
          >
            <div className="absolute top-4 right-4 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-orange-500/20">
              Recommended
            </div>
            
            <div className={`w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20 transition-transform ${!isPriorityAccessDisabled && 'group-hover:scale-110'}`}>
              <Star className="text-white w-8 h-8" />
            </div>
            
            <h3 className={`text-2xl font-bold mb-4 transition-colors ${!isPriorityAccessDisabled && 'group-hover:text-orange-400'}`}>Priority Access</h3>
            
            <ul className="space-y-4 text-gray-400 mb-8 flex-1 w-full">
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-orange-500" />
                <span>Early access to live sessions</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-orange-500" />
                <span className="text-white font-semibold">10x Voting Power</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-orange-500" />
                <span>Exclusive diverse content</span>
              </li>
            </ul>

            <div className={`w-full py-4 rounded-xl bg-orange-500 text-black font-bold text-center transition-colors ${!isPriorityAccessDisabled && 'group-hover:bg-orange-400'}`}>
              Get Priority Access
            </div>
          </button>

          {/* Option B: Vote */}
          <button 
            onClick={() => !isVoteDisabled && router.push(`/onboarding/vote?email=${email}`)}
            disabled={isVoteDisabled}
            className={`group relative flex flex-col items-center p-8 rounded-3xl bg-white/5 border border-white/10 text-left h-full transition-all duration-300 ${
              isVoteDisabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:border-blue-500/50 hover:bg-white/10 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/20'
            }`}
          >
            <div className={`w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 transition-transform ${!isVoteDisabled && 'group-hover:scale-110'}`}>
              <Vote className="text-white w-8 h-8" />
            </div>
            
            <h3 className={`text-2xl font-bold mb-4 transition-colors ${!isVoteDisabled && 'group-hover:text-blue-400'}`}>Cast Your Vote</h3>
            
            <ul className="space-y-4 text-gray-400 mb-8 flex-1 w-full">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center">
                  <span className="block w-2h-2 bg-gray-600 rounded-full" />
                </div>
                <span>Vote for next Celebrity Trainer</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center">
                  <span className="block w-2h-2 bg-gray-600 rounded-full" />
                </div>
                <span>Standard Notification</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center">
                  <span className="block w-2h-2 bg-gray-600 rounded-full" />
                </div>
                <span>1 Vote per person</span>
              </li>
            </ul>

            <div className={`w-full py-4 rounded-xl bg-white/10 text-white font-bold text-center transition-colors ${!isVoteDisabled && 'group-hover:bg-white/20'}`}>
              Start Voting
            </div>
          </button>
        </div>

        {/* Status Messages Below Cards */}
        {userStatus === 'paid' && (
          <div className="w-full max-w-2xl bg-white/10 border border-white/20 rounded-3xl p-8 text-center backdrop-blur-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
              <CheckCircle className="text-white w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">You{`'`}re All Set!</h2>
            <p className="text-green-400 text-xl mb-4">Thank you for subscribing to Priority Access.</p>
            <p className="text-gray-300 text-lg mb-2">We{`'`}ll notify you when the first live session drops.</p>
            <p className="text-gray-400 text-sm">Keep an eye on your inbox at <span className="text-white font-semibold">{email}</span></p>
          </div>
        )}

        {votedFor && (
          <div className="w-full max-w-2xl flex flex-col gap-6">
            <div className="bg-white/10 border border-white/20 rounded-3xl p-8 text-center backdrop-blur-sm">
              <h2 className="text-3xl font-bold text-white mb-6">Vote Recorded!</h2>
              {CELEB_IMAGES[votedFor] && (
                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-orange-500 mb-6 shadow-xl shadow-orange-500/30">
                  <Image src={CELEB_IMAGES[votedFor]} alt={votedFor} fill className="object-cover" />
                </div>
              )}
              <p className="text-gray-200 text-xl mb-2">You voted for</p>
              <p className="text-3xl font-bold text-orange-400 mb-4">{votedFor}</p>
              <p className="text-gray-400">We{`'`}ll keep you posted on the results and notify you when sessions begin.</p>
            </div>
            
            <button 
              type="button" 
              onClick={() => setShowPreview(!showPreview)} 
              className="text-gray-400 hover:text-white text-sm underline transition-colors mx-auto cursor-pointer"
            >
              {showPreview ? "Hide Candidates" : "Preview All Celebrities"}
            </button>
            
            {showPreview && (
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(CELEB_IMAGES).map(([name, img]) => (
                  <div key={name} className="bg-white/5 rounded-xl p-4 text-center border border-white/10 hover:border-white/20 transition-colors">
                    <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden mb-3 border-2 border-white/20">
                      <Image src={img} alt={name} fill className="object-cover" />
                    </div>
                    <p className="text-sm text-gray-300 font-medium">{name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingOptions() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <OnboardingOptionsContent />
    </Suspense>
  );
}
