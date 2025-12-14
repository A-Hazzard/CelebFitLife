/**
 * 404 Not Found Page
 *
 * Displays a custom 404 error page with navigation back to home.
 * Features:
 * - GSAP animations for smooth entrance
 * - Responsive design matching CelebFitLife branding
 * - Interactive elements with hover effects
 *
 * @module app/not-found
 */

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { Home, ArrowLeft, Zap } from "lucide-react";
import TiltCard from "@/components/TiltCard";

gsap.registerPlugin();

/**
 * 404 Not Found Page Content Component
 * Handles all animations and rendering logic
 */
function NotFoundContent() {
  const router = useRouter();
  
  // ============================================================================
  // Refs for Animations
  // ============================================================================
  const containerRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLHeadingElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // Animations
  // ============================================================================
  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.2 });

    // Background animation
    if (backgroundRef.current) {
      gsap.fromTo(
        backgroundRef.current.children,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: "power2.out",
          stagger: 0.2,
        }
      );
    }

    // Container entrance
    if (containerRef.current) {
      tl.fromTo(
        containerRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );
    }

    // 404 Number animation
    if (numberRef.current) {
      tl.fromTo(
        numberRef.current,
        { opacity: 0, scale: 0.5, rotation: -180 },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.8,
          ease: "back.out(1.7)",
        },
        "-=0.4"
      );
    }

    // Title animation
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.3"
      );
    }

    // Description animation
    if (descriptionRef.current) {
      tl.fromTo(
        descriptionRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      );
    }

    // Buttons animation
    if (buttonsRef.current) {
      tl.fromTo(
        buttonsRef.current.children,
        { opacity: 0, y: 20, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: "back.out(1.2)",
          stagger: 0.1,
        },
        "-=0.3"
      );
    }
  }, []);

  // ============================================================================
  // Event Handlers
  // ============================================================================
  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div ref={backgroundRef} className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-orange-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Main Content */}
      <div
        ref={containerRef}
        className="relative z-10 max-w-2xl w-full flex flex-col items-center gap-8 text-center"
      >
        <TiltCard className="glass-card rounded-3xl p-8 sm:p-12" intensity={8}>
          {/* 404 Number */}
          <h1
            ref={numberRef}
            className="text-8xl sm:text-9xl md:text-[12rem] font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 mb-4 leading-none"
          >
            404
          </h1>

          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl" />
              <Zap className="relative w-16 h-16 text-orange-500" />
            </div>
          </div>

          {/* Title */}
          <h2
            ref={titleRef}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 uppercase tracking-tight"
          >
            Page Not Found
          </h2>

          {/* Description */}
          <p
            ref={descriptionRef}
            className="text-gray-300 text-lg sm:text-xl mb-8 max-w-xl mx-auto leading-relaxed"
          >
            Looks like this page took a wrong turn. The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div
            ref={buttonsRef}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
          >
            <button
              onClick={handleGoHome}
              className="group relative px-8 py-4 bg-orange-500 hover:bg-orange-400 text-black font-bold text-lg rounded-xl transition-all transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/40 flex items-center justify-center gap-2 w-full sm:w-auto min-w-[200px] cursor-pointer"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Go Home
            </button>

            <button
              onClick={handleGoBack}
              className="group relative px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-lg rounded-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 w-full sm:w-auto min-w-[200px] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </button>
          </div>

          {/* Additional Help Text */}
          <p className="text-gray-500 text-sm mt-8">
            Need help?{" "}
            <button
              onClick={() => router.push("/?contact=true")}
              className="text-orange-500 hover:text-orange-400 underline transition-colors cursor-pointer"
            >
              Contact Support
            </button>
          </p>
        </TiltCard>
      </div>
    </div>
  );
}

/**
 * 404 Not Found Page
 * Wrapper component for the 404 page
 */
export default function NotFound() {
  return <NotFoundContent />;
}

