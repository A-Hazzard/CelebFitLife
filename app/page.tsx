"use client";

import Image from "next/image";
import heroMobile from "../public/heroMobile.png";
import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
import { generateFAQSchema } from "@/lib/seo/schema";
import WaitlistForm from "@/components/WaitlistForm";

gsap.registerPlugin(ScrollTrigger, TextPlugin);

export default function Home() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Refs for animations
  const navRef = useRef<HTMLElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const whatIsCelebFitRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const featuresTitleRef = useRef<HTMLHeadingElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const howItWorksTitleRef = useRef<HTMLHeadingElement>(null);
  const howItWorksDescRef = useRef<HTMLParagraphElement>(null);
  const howItWorksFormRef = useRef<HTMLFormElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const faqTitleRef = useRef<HTMLHeadingElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const faqs = [
    {
      question: "How do I join a live session?",
      answer: "Simply join our waitlist to get early access to upcoming sessions. Once you're on the list, you'll receive exclusive notifications about upcoming live workouts with celebrity trainers. Sessions are limited and run on a first-come, first-served basis, so make sure to join early!"
    },
    {
      question: "How often are the live sessions available?",
      answer: "Live sessions are scheduled regularly throughout the week with different celebrity trainers. Due to the exclusive nature of these sessions, they are limited and run on a first-come, first-served basis. Once you join our waitlist, you&apos;ll receive notifications about upcoming sessions."
    },
    {
      question: "Can I replay or rewatch the live sessions?",
      answer: "No, that&apos;s what makes CelebFitLife special! Our sessions are live and gone - no replays, no reruns. This creates an exclusive, one-time experience that encourages you to show up and give your all. The limited nature adds to the excitement and motivation."
    },
    {
      question: "What equipment do I need for the workouts?",
      answer: "Most sessions are designed to be accessible with minimal equipment. Basic workouts might only require your bodyweight, while others may suggest simple items like dumbbells, resistance bands, or a yoga mat. We&apos;ll notify you about any specific equipment needs before each session."
    },
    {
      question: "How do I interact with the celebrity trainers during sessions?",
      answer: "During live sessions, you can ask questions through our chat feature, and trainers will respond in real-time. They&apos;ll provide form corrections, motivation, and answer your fitness questions throughout the workout and during cooldown periods."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const scrollToFAQ = () => {
    const faqSection = document.getElementById('faq-section');
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Fast Animation functions
  const openModal = (modalType: string) => {
    setActiveModal(modalType);
    
    const tl = gsap.timeline();
    
    // Quick backdrop animation
    if (backdropRef.current) {
      tl.fromTo(backdropRef.current, 
        { 
          opacity: 0, 
          backdropFilter: "blur(0px)"
        },
        { 
          opacity: 1, 
          backdropFilter: "blur(20px)", 
          duration: 0.2, 
          ease: "power2.out" 
        }
      );
    }
    
    // Fast modal entrance
    if (modalRef.current) {
      tl.fromTo(modalRef.current, {
        scale: 0.9,
        opacity: 0,
        y: 20
      }, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        delay: 0.1
      }, "-=0.1");
    }
  };

  const closeModal = () => {
    const tl = gsap.timeline();
    
    // Fast modal exit
    if (modalRef.current) {
      tl.to(modalRef.current, {
        scale: 0.9,
        opacity: 0,
        y: 20,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          setActiveModal(null);
        }
      });
    }
    
    // Quick backdrop exit
    if (backdropRef.current) {
      tl.to(backdropRef.current, {
        opacity: 0,
        backdropFilter: "blur(0px)",
        duration: 0.2,
        ease: "power2.in"
      }, "-=0.1");
    }
  };

  // Advanced page animations
  useEffect(() => {
    // Animate navigation on load
    if (navRef.current) {
      gsap.fromTo(navRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }
      );
    }

    // Animate hero content (but not the background image)
    if (heroContentRef.current) {
      gsap.fromTo(heroContentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.4, delay: 0.3, ease: "power2.out" }
      );
    }

    // Animate "What is CelebFitLife" section
    if (whatIsCelebFitRef.current) {
      ScrollTrigger.create({
        trigger: whatIsCelebFitRef.current,
        start: "top 80%",
        onEnter: () => {
          const title = whatIsCelebFitRef.current?.querySelector('h3');
          const paragraph = whatIsCelebFitRef.current?.querySelector('p');
          
          if (title) {
            gsap.fromTo(title,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 1.0, ease: "power2.out" }
            );
          }
          
          if (paragraph) {
            gsap.fromTo(paragraph,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 1.0, delay: 0.2, ease: "power2.out" }
            );
          }
        }
      });
    }
    
    // Enhanced Features section animation
    if (featuresRef.current) {
      ScrollTrigger.create({
        trigger: featuresRef.current,
        start: "top 80%",
        onEnter: () => {
          // Animate title
          if (featuresTitleRef.current) {
            gsap.fromTo(featuresTitleRef.current,
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 1.0, ease: "power2.out" }
            );
          }

          // Animate feature cards
          const cards = featuresRef.current?.querySelectorAll('.feature-card');
          if (cards) {
            gsap.fromTo(cards, 
              { 
                opacity: 0, 
                y: 40, 
                scale: 0.9
              },
              { 
                opacity: 1, 
                y: 0, 
                scale: 1,
                duration: 0.9, 
                stagger: 0.2, 
                delay: 0.3,
                ease: "back.out(1.1)" 
              }
            );
            
            // Quick hover animations
            cards.forEach((card) => {
              card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                  scale: 1.02,
                  y: -5,
                  duration: 0.3,
                  ease: "power2.out"
                });
              });
              
              card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                  scale: 1,
                  y: 0,
                  duration: 0.3,
                  ease: "power2.out"
                });
              });
            });
          }
        }
      });
    }
    
    // Enhanced How it Works section animation
    if (stepsRef.current) {
      ScrollTrigger.create({
        trigger: stepsRef.current,
        start: "top 75%",
        onEnter: () => {
          // Animate title
          if (howItWorksTitleRef.current) {
            gsap.fromTo(howItWorksTitleRef.current,
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 1.0, ease: "power2.out" }
            );
          }
          
          // Animate description
          if (howItWorksDescRef.current) {
            gsap.fromTo(howItWorksDescRef.current,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 1.0, delay: 0.2, ease: "power2.out" }
            );
          }
          
          // Animate form
          if (howItWorksFormRef.current) {
            gsap.fromTo(howItWorksFormRef.current,
              { opacity: 0, y: 20, scale: 0.95 },
              { opacity: 1, y: 0, scale: 1, duration: 0.9, delay: 0.4, ease: "back.out(1.2)" }
            );
          }
          
          // Animate step cards with stagger
          const steps = stepsRef.current?.querySelectorAll('.step-item');
          if (steps) {
            gsap.fromTo(steps, 
              { 
                opacity: 0, 
                x: -30, 
                scale: 0.9
              },
              { 
                opacity: 1, 
                x: 0, 
                scale: 1,
                duration: 0.9, 
                stagger: 0.15, 
                delay: 0.5,
                ease: "back.out(1.1)" 
              }
            );
          }
        }
      });
    }
    
    // Enhanced FAQ animation
    if (faqRef.current) {
      ScrollTrigger.create({
        trigger: faqRef.current,
        start: "top 80%",
        onEnter: () => {
          // Animate subtitle
          const subtitle = faqRef.current?.querySelector('p');
          if (subtitle) {
            gsap.fromTo(subtitle,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" }
            );
          }

          // Animate title
          if (faqTitleRef.current) {
            gsap.fromTo(faqTitleRef.current,
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 1.0, delay: 0.2, ease: "power2.out" }
            );
          }

          // Animate FAQ items
          const faqItems = faqRef.current?.querySelectorAll('.faq-item');
          if (faqItems) {
            gsap.fromTo(faqItems, 
              { 
                opacity: 0, 
                x: -30,
                scale: 0.95
              },
              { 
                opacity: 1, 
                x: 0,
                scale: 1,
                duration: 0.9, 
                stagger: 0.12, 
                delay: 0.4,
                ease: "back.out(1.1)" 
              }
            );
          }
        }
      });
    }

    // Animate Footer
    if (footerRef.current) {
      ScrollTrigger.create({
        trigger: footerRef.current,
        start: "top 90%",
        onEnter: () => {
          const footerContent = footerRef.current?.querySelectorAll('div > div');
          if (footerContent) {
            gsap.fromTo(footerContent,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.9, stagger: 0.15, ease: "power2.out" }
            );
          }
        }
      });
    }
  }, []);

  // Generate FAQ structured data
  const faqSchema = generateFAQSchema(faqs);

  return (
    <>
      {/* FAQ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          {/* Mobile Image */}
          <Image
            src={heroMobile}
            alt="Athletic person training"
            fill
            className="object-cover object-center md:hidden"
            priority
          />
          {/* Desktop Image */}
          <Image
            src="https://api.builder.io/api/v1/image/assets/TEMP/9a68ee45eaf40a3bd6e1879bb1aa452571257241?width=2880"
            alt="Athletic person training"
            fill
            className="hidden md:block object-cover object-center lg:object-[center_30%] xl:object-[center_25%] 2xl:object-[center_20%]"
            priority
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>

        {/* Navigation */}
        <nav ref={navRef} className="relative z-10 flex items-center justify-between px-4 md:px-6 lg:px-40 py-4 md:py-12">
          <div className="flex items-center gap-4">
            <svg width="120" height="22" viewBox="0 0 146 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:w-[146px] md:h-[26px]">
              <path d="M11.2251 26C4.57318 26 0 21.1294 0 13.035C0 5.01078 4.50389 0 11.2597 0C17.3573 0 20.614 3.2938 21.688 8.72507L17.7384 8.93531C17.0801 5.53639 15.0014 3.469 11.2597 3.469C6.79048 3.469 3.88028 7.11321 3.88028 13.035C3.88028 18.9919 6.82513 22.531 11.2251 22.531C15.2093 22.531 17.3227 20.2534 17.9116 16.5391L21.8612 16.7493C20.9258 22.3908 17.288 26 11.2251 26Z" fill="white"/>
              <path d="M33.5288 25.8598C28.1934 25.8598 24.7982 22.0054 24.7982 16.1186C24.7982 10.2318 28.1934 6.37736 33.4249 6.37736C38.4485 6.37736 41.8783 9.98652 41.8783 16.2588V17.2049H28.6438C28.8171 20.8491 30.6533 22.6712 33.5635 22.6712C35.7461 22.6712 37.2012 21.5849 37.7902 19.8329L41.6012 20.0782C40.6311 23.5472 37.617 25.8598 33.5288 25.8598ZM28.6438 14.4016H37.9634C37.7556 11.1078 35.954 9.531 33.4249 9.531C30.8265 9.531 29.0596 11.248 28.6438 14.4016Z" fill="white"/>
              <path d="M49.8527 25.4394C47.4276 25.4394 45.8339 24.248 45.8339 21.4798V0.560646H49.5063V21.1294C49.5063 22.0054 49.9567 22.3908 50.7882 22.3908H52.2433V25.4394H49.8527Z" fill="white"/>
              <path d="M63.5052 25.8598C58.1698 25.8598 54.7745 22.0054 54.7745 16.1186C54.7745 10.2318 58.1698 6.37736 63.4012 6.37736C68.4248 6.37736 71.8547 9.98652 71.8547 16.2588V17.2049H58.6202C58.7934 20.8491 60.6296 22.6712 63.5398 22.6712C65.7225 22.6712 67.1776 21.5849 67.7665 19.8329L71.5775 20.0782C70.6074 23.5472 67.5933 25.8598 63.5052 25.8598ZM58.6202 14.4016H67.9398C67.7319 11.1078 65.9303 9.531 63.4012 9.531C60.8028 9.531 59.0359 11.248 58.6202 14.4016Z" fill="white"/>
              <path d="M84.5514 25.8598C81.9876 25.8598 79.9435 24.6685 78.9042 22.6361L78.8003 25.4394H75.3704V0.560646H79.0428V9.42588C79.9782 7.81402 81.9876 6.37736 84.5514 6.37736C89.3671 6.37736 92.3812 10.1617 92.3812 16.1186C92.3812 22.0755 89.3671 25.8598 84.5514 25.8598ZM83.9624 22.6361C86.7687 22.6361 88.5702 20.1482 88.5702 16.1186C88.5702 12.0189 86.8033 9.60108 83.9971 9.60108C80.879 9.60108 79.0428 12.0189 79.0428 16.1186C79.0428 20.1482 80.879 22.6361 83.9624 22.6361Z" fill="white"/>
              <path d="M96.5154 25.4394V0.560646H113.492V5.04582H101.781V11.0728H112.868V15.4879H101.781V25.4394H96.5154Z" fill="#FF5500"/>
              <path d="M117.424 25.4394V0.560646H122.69V25.4394H117.424Z" fill="#FF5500"/>
              <path d="M133.354 25.4394V5.04582H126.01V0.560646H146V5.04582H138.655V25.4394H133.354Z" fill="#FF5500"/>
            </svg>
            <span className="bg-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider hidden sm:inline-block">
              Coming Soon
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-6">
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => openModal('features')}
                className="text-white hover:text-orange-500 text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                Features
              </button>
              <button 
                onClick={() => openModal('how-it-works')}
                className="text-white hover:text-orange-500 text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                How it Works
              </button>
              <button 
                onClick={scrollToFAQ}
                className="text-white hover:text-orange-500 text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                FAQ
            </button>
            </div>
            
            {/* Mobile hamburger menu */}
            <div className="md:hidden">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 6H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 18H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div ref={heroContentRef} className="relative z-10 px-4 md:px-6 lg:px-40">
          {/* Mobile Layout */}
          <div className="md:hidden flex flex-col justify-end h-screen pb-12">
            <div className="glass-card rounded-3xl p-6">
              <h1 className="text-3xl font-bold leading-tight text-white mb-4 uppercase">
                TRAIN WITH YOUR IDOL.{" "}
                <span className="text-orange-500">LIVE</span>
              </h1>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Be part of the world&apos;s first live celebrity training experience. Limited sports. No reruns
              </p>
              
              <div className="mb-6">
                <WaitlistForm variant="mobile" />
              </div>
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden md:block">
          <div className="glass-card rounded-3xl p-14 max-w-xl mt-24">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-white mb-6 uppercase">
              TRAIN WITH YOUR IDOL.{" "}
              <span className="text-orange-500">LIVE</span>
            </h1>
            <p className="text-gray-300 text-xl mb-12 leading-relaxed">
              Be part of the world&apos;s first live celebrity training experience. Limited sports. No reruns
            </p>
            
            <div className="mb-8">
              <WaitlistForm variant="desktop" />
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is CelebFitLife Section */}
      <section ref={whatIsCelebFitRef} className="px-4 md:px-6 lg:px-56 py-12 md:py-24">
        <div className="text-center mb-8 md:mb-16">
          <h3 className="text-sm md:text-base text-white uppercase tracking-widest mb-4">WHAT IS CELEBFIT?</h3>
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
              CelebFitLife is the world&apos;s first live celebrity fitness platform. We connect fitness enthusiasts with celebrity trainers and athletes through real-time, interactive workout sessions. You can join live streams, ask questions, get personalized feedback, and train alongside your fitness idols in exclusive, limited-time sessions.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
                  <section ref={featuresRef} className="px-4 md:px-6 lg:px-56 pb-12 md:pb-24">
        <div className="text-center mb-8 md:mb-16">
          <h2 ref={featuresTitleRef} className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-8 uppercase">
            TRAIN WITH THE PEOPLE WHO INSPIRE YOU. IN REAL TIME
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {/* Feature 1 - Live Workouts */}
          <div className="feature-card relative group">
            <div className="relative h-[300px] md:h-[507px] rounded-lg overflow-hidden">
              <Image
                src="https://api.builder.io/api/v1/image/assets/TEMP/3addd86bb18b972972857cdcbe4c48b756c3d6c9?width=800"
                alt="Live workouts"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 card-gradient"></div>
              <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 md:right-8">
                <p className="text-orange-500 text-sm font-medium uppercase tracking-wider mb-2">
                  LIVE WORKOUTS
                </p>
                <p className="text-white text-base md:text-lg font-normal uppercase tracking-wide leading-tight">
                  ON LIVE SESSIONS DOING ALL KIND OF EXERCISES
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2 - Live. Then Gone */}
          <div className="feature-card relative group">
            <div className="relative h-[300px] md:h-[507px] rounded-lg overflow-hidden">
              <Image
                src="https://api.builder.io/api/v1/image/assets/TEMP/656ca994e2de4f472bb4e951d1266a5a7c041478?width=800"
                alt="Live workout session"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 card-gradient"></div>
              <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 md:right-8">
                <p className="text-orange-500 text-sm font-medium uppercase tracking-wider mb-2">
                  LIVE. THEN GONE.
                </p>
                <p className="text-white text-base md:text-lg font-normal uppercase tracking-wide leading-tight">
                  NO REPLAYS. NO RERUNS. SHOW UP OR MISS OUT
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3 - Ask Questions */}
          <div className="relative group md:col-span-2 lg:col-span-1">
            <div className="relative h-[300px] md:h-[507px] rounded-lg overflow-hidden">
              <Image
                src="https://api.builder.io/api/v1/image/assets/TEMP/e6316773bf08160c15c9ade93dd16c4bd4a4d520?width=800"
                alt="Ask questions"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 card-gradient"></div>
              <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 md:right-8">
                <p className="text-orange-500 text-sm font-medium uppercase tracking-wider mb-2">
                  ASK QUESTIONS
                </p>
                <p className="text-white text-base md:text-lg font-normal uppercase tracking-wide leading-tight">
                  GET ANSWERS MID-SESSIONS AND DURING COOLDOWN
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
                  <section ref={stepsRef} className="px-4 md:px-6 lg:px-40 py-12 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start">
          <div>
            <h2 ref={howItWorksTitleRef} className="text-3xl md:text-5xl font-bold text-gray-100 mb-6 md:mb-8">HOW IT WORKS?</h2>
            <p ref={howItWorksDescRef} className="text-gray-300 text-base md:text-lg leading-relaxed mb-6 md:mb-8">
              Join the world&apos;s first live celebrity fitness experience. Connect with your favorite athletes and trainers in real-time, interactive workout sessions that push you to achieve your personal best.
            </p>
            <div ref={howItWorksFormRef}>
              <WaitlistForm variant="inline" />
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            {/* Step 1 */}
            <div className="step-item step-card rounded-3xl p-6 md:p-8">
              <div className="flex items-start gap-4 md:gap-6">
                <svg width="32" height="33" viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg" className="step-number flex-shrink-0">
                  <path d="M4 16.2793H20" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.125 24.2793C9.31567 26.7193 12.461 28.2793 15.9997 28.2793C22.6277 28.2793 27.9997 22.906 27.9997 16.2793C27.9997 9.6513 22.6277 4.2793 15.9997 4.2793C12.461 4.2793 9.31567 5.8393 7.125 8.2793" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 12.2793L4 16.2793L8 20.2793" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-100 mb-2">Sign up</h3>
                  <p className="text-gray-300 text-base md:text-lg">Join the exclusive waitlist to secure your spot in our limited live sessions.</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="step-item step-card rounded-3xl p-6 md:p-8">
              <div className="flex items-start gap-4 md:gap-6">
                <svg width="32" height="33" viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg" className="step-number flex-shrink-0">
                  <path fillRule="evenodd" clipRule="evenodd" d="M28.0049 13.3479H27.0045C25.1628 13.3479 23.6699 14.8409 23.6699 16.6827C23.6699 17.5671 24.0212 18.4152 24.6465 19.0407C25.272 19.666 26.1201 20.0173 27.0045 20.0173H28.0049V23.3521C28.0049 24.8255 26.8105 26.0199 25.3372 26.0199H21.3356V26.6868C21.3356 28.5285 19.8425 30.0215 18.0008 30.0215C16.1591 30.0215 14.6661 28.5285 14.6661 26.6868V26.0199H10.6644C9.19106 26.0199 7.99666 24.8255 7.99666 23.3521V20.0173H7.32972C5.488 20.0173 3.995 18.5244 3.995 16.6827C3.995 14.8409 5.488 13.3479 7.32972 13.3479H7.99666V10.0132C7.99666 8.53982 9.19106 7.34542 10.6644 7.34542H14.6661V6.67847C14.6661 4.83676 16.1591 3.34375 18.0008 3.34375C19.8425 3.34375 21.3356 4.83676 21.3356 6.67847V7.34542H25.3372C26.8105 7.34542 28.0049 8.53982 28.0049 10.0132V13.3479Z" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-100 mb-2">Get Notified</h3>
                  <p className="text-gray-300 text-base md:text-lg">Receive exclusive notifications about upcoming sessions with your favorite celebrity trainers.</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="step-item step-card rounded-3xl p-6 md:p-8">
              <div className="flex items-start gap-4 md:gap-6">
                <svg width="32" height="33" viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg" className="step-number flex-shrink-0">
                  <path d="M17.573 14.6092C18.4414 15.4776 18.4414 16.8862 17.573 17.7546C16.7046 18.623 15.2961 18.623 14.4277 17.7546C13.5593 16.8862 13.5593 15.4776 14.4277 14.6092C15.2961 13.7396 16.7046 13.7396 17.573 14.6092Z" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.33008 16.1797C9.33008 15.6914 9.44212 15.2086 9.66088 14.763C10.7827 12.4675 13.2637 10.9922 15.9995 10.9922C18.7354 10.9922 21.2163 12.4675 22.3382 14.763C22.5569 15.2086 22.669 15.6914 22.669 16.1797C22.669 16.6678 22.5569 17.1508 22.3382 17.5962C21.215 19.8905 18.7341 21.3672 15.9995 21.3672C13.2637 21.3672 10.7827 19.8918 9.66088 17.5962C9.44212 17.1508 9.33008 16.6678 9.33008 16.1797Z" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 28.1858C22.6302 28.1858 28.005 22.811 28.005 16.1808C28.005 9.5506 22.6302 4.17578 16 4.17578C9.36982 4.17578 3.995 9.5506 3.995 16.1808C3.995 22.811 9.36982 28.1858 16 28.1858Z" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-100 mb-2">Train Live</h3>
                  <p className="text-gray-300 text-base md:text-lg">Experience high-energy live workouts with celebrity trainers. Ask questions, get real-time feedback, and train alongside your fitness idols.</p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="step-item step-card rounded-3xl p-6 md:p-8">
              <div className="flex items-start gap-4 md:gap-6">
                <svg width="32" height="33" viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg" className="step-number flex-shrink-0">
                  <path d="M17.482 24.2402C16.5336 25.19 16.0007 26.477 16 27.8192V29.4278" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.5176 24.2422C15.466 25.1919 15.9989 26.479 15.9996 27.8211V29.4298" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23.0029 16.2383C18.5036 18.0164 13.4964 18.0164 8.99707 16.2383" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M25.3369 11.4219H29.3386" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M27.3377 13.4216L25.3369 11.4207L27.3377 9.41992" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.6628 11.4219H2.66113" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.66199 9.41992L6.66281 11.4207L4.66199 13.4216" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23.4107 2.75L22.6104 4.9616C21.2312 8.75395 21.4724 12.9466 23.2774 16.5557C25.2403 20.483 25.3446 25.0822 23.5615 29.0944L23.4147 29.4265" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.58886 2.75L9.3892 4.9616C10.7683 8.75395 10.5271 12.9466 8.72225 16.5557C6.75925 20.483 6.65504 25.0822 8.43813 29.0944L8.58486 29.4265" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.0117 7.19727H21.9874" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-100 mb-2">Watch your Gains</h3>
                  <p className="text-gray-300 text-base md:text-lg">Track your progress and celebrate your transformation as you achieve the fitness goals you&apos;ve always dreamed of reaching.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
                  <section id="faq-section" ref={faqRef} className="px-4 md:px-6 lg:px-40 py-12 md:py-24">
        <div className="text-center mb-8 md:mb-16">
          <p className="text-gray-500 text-xs md:text-sm uppercase tracking-widest mb-4 md:mb-8">WANT TO KNOW MORE?</p>
          <h2 ref={faqTitleRef} className="text-3xl md:text-5xl font-bold text-gray-100">FREQUENTLY ASKED QUESTIONS</h2>
        </div>

        <div className="max-w-4xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item rounded-2xl p-4 md:p-6 transition-all duration-200 hover:bg-opacity-50">
              <div 
                className="flex justify-between items-start cursor-pointer"
                onClick={() => toggleFAQ(index)}
              >
                <h3 className="text-lg md:text-xl font-medium text-white pr-4">{faq.question}</h3>
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`flex-shrink-0 transition-transform duration-300 ease-in-out ${
                    openFAQ === index ? 'rotate-45' : 'rotate-0'
                  }`}
                >
                  {openFAQ === index ? (
                    <>
                <path d="M7.75586 7.75781L16.2411 16.2431" stroke="#FF6600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.75691 16.2431L16.2422 7.75781" stroke="#FF6600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </>
                  ) : (
                    <>
                      <path d="M6 12H18" stroke="#FF6600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 18V6" stroke="#FF6600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </>
                  )}
              </svg>
            </div>
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openFAQ === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-white text-sm md:text-base leading-relaxed mt-4">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer ref={footerRef} className="border-t border-gray-600 bg-black px-4 md:px-6 lg:px-56 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-center gap-6 md:gap-8">
          <div className="text-center lg:text-left w-full lg:w-auto">
            <svg width="142" height="28" viewBox="0 0 142 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6 mx-auto lg:mx-0">
              <path d="M10.9175 27C4.44789 27 0 22.1294 0 14.035C0 6.01078 4.3805 1 10.9512 1C16.8818 1 20.0492 4.2938 21.0938 9.72507L17.2524 9.93531C16.6122 6.53639 14.5904 4.469 10.9512 4.469C6.60444 4.469 3.77397 8.11321 3.77397 14.035C3.77397 19.9919 6.63814 23.531 10.9175 23.531C14.7926 23.531 16.8481 21.2534 17.4209 17.5391L21.2623 17.7493C20.3525 23.3908 16.8144 27 10.9175 27Z" fill="white"/>
              <path d="M32.6102 26.8598C27.421 26.8598 24.1188 23.0054 24.1188 17.1186C24.1188 11.2318 27.421 7.37736 32.5091 7.37736C37.3951 7.37736 40.731 10.9865 40.731 17.2588V18.2049H27.8591C28.0276 21.8491 29.8134 23.6712 32.6439 23.6712C34.7668 23.6712 36.182 22.5849 36.7549 20.8329L40.4614 21.0782C39.5179 24.5472 36.5864 26.8598 32.6102 26.8598ZM27.8591 15.4016H36.9233C36.7212 12.1078 34.969 10.531 32.5091 10.531C29.9819 10.531 28.2634 12.248 27.8591 15.4016Z" fill="white"/>
              <path d="M48.4869 26.4394C46.1282 26.4394 44.5781 25.248 44.5781 22.4798V1.56065H48.1499V22.1294C48.1499 23.0054 48.588 23.3908 49.3967 23.3908H50.8119V26.4394H48.4869Z" fill="white"/>
              <path d="M61.7653 26.8598C56.5761 26.8598 53.2739 23.0054 53.2739 17.1186C53.2739 11.2318 56.5761 7.37736 61.6642 7.37736C66.5501 7.37736 69.886 10.9865 69.886 17.2588V18.2049H57.0141C57.1826 21.8491 58.9685 23.6712 61.799 23.6712C63.9218 23.6712 65.3371 22.5849 65.9099 20.8329L69.6165 21.0782C68.673 24.5472 65.7414 26.8598 61.7653 26.8598ZM57.0141 15.4016H66.0784C65.8762 12.1078 64.124 10.531 61.6642 10.531C59.137 10.531 57.4185 12.248 57.0141 15.4016Z" fill="white"/>
              <path d="M82.2349 26.8598C79.7414 26.8598 77.7533 25.6685 76.7424 23.6361L76.6413 26.4394H73.3054V1.56065H76.8772V10.4259C77.787 8.81402 79.7414 7.37736 82.2349 7.37736C86.9187 7.37736 89.8502 11.1617 89.8502 17.1186C89.8502 23.0755 86.9187 26.8598 82.2349 26.8598ZM81.6621 23.6361C84.3914 23.6361 86.1436 21.1482 86.1436 17.1186C86.1436 13.0189 84.4251 10.6011 81.6958 10.6011C78.6631 10.6011 76.8772 13.0189 76.8772 17.1186C76.8772 21.1482 78.6631 23.6361 81.6621 23.6361Z" fill="white"/>
              <path d="M93.8711 26.4394V1.56065H110.382V6.04582H98.9929V12.0728H109.776V16.4879H98.9929V26.4394H93.8711Z" fill="#FF7700"/>
              <path d="M114.207 26.4394V1.56065H119.329V26.4394H114.207Z" fill="#FF7700"/>
              <path d="M129.701 26.4394V6.04582H122.557V1.56065H142V6.04582H134.856V26.4394H129.701Z" fill="#FF7700"/>
            </svg>
          <nav className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-8 mb-6 md:mb-8">
            <button 
              onClick={() => openModal('features')}
              className="text-gray-300 hover:text-white text-sm md:text-base transition-all duration-300 hover:scale-105"
            >
              Features
            </button>
            <button 
              onClick={() => openModal('how-it-works')}
              className="text-gray-300 hover:text-white text-sm md:text-base transition-all duration-300 hover:scale-105"
            >
              How it works
            </button>
            <button 
              onClick={scrollToFAQ}
              className="text-gray-300 hover:text-white text-sm md:text-base transition-all duration-300 hover:scale-105"
            >
              FAQs
            </button>
            </nav>
            <p className="text-white text-sm md:text-base">© CelebFit 2025</p>
          </div>
          <div className="flex justify-center lg:justify-end gap-4 md:gap-8 w-full lg:w-auto">
            <button 
              onClick={() => openModal('privacy')}
              className="text-gray-300 hover:text-white text-sm md:text-base transition-all duration-300 hover:scale-105"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => openModal('terms')}
              className="text-gray-300 hover:text-white text-sm md:text-base transition-all duration-300 hover:scale-105"
            >
              Terms Of Service
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {activeModal && (
        <div 
          ref={backdropRef}
          className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div 
            ref={modalRef}
            className="relative bg-gradient-to-br from-slate-900 via-gray-900 to-black rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] border border-gray-800/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-500/5 opacity-50"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent"></div>
            
            {/* Header */}
            <div className="relative bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm p-8 border-b border-gray-800/50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">
                    {activeModal === 'features' && '✨ Features'}
                    {activeModal === 'how-it-works' && '🚀 How It Works'}
                    {activeModal === 'privacy' && '🔒 Privacy Policy'}
                    {activeModal === 'terms' && '📋 Terms of Service'}
                  </h2>
                  <p className="text-gray-400 text-lg">
                    {activeModal === 'features' && 'Discover what makes CelebFitLife unique'}
                    {activeModal === 'how-it-works' && 'Your journey to fitness starts here'}
                    {activeModal === 'privacy' && 'Your privacy and data protection'}
                    {activeModal === 'terms' && 'Terms and conditions for our platform'}
                  </p>
                </div>
                <button 
                  onClick={closeModal}
                  className="group p-3 rounded-xl bg-gray-800/60 hover:bg-gray-700/60 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-lg"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 group-hover:text-white transition-colors">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="relative p-8 overflow-y-auto max-h-[calc(85vh-140px)] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">

              {activeModal === 'features' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="group relative bg-gradient-to-br from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/25">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                          <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-orange-400 transition-colors">Live Celebrity Workouts</h3>
                      <p className="text-gray-300 leading-relaxed text-lg">
                        Train with your favorite celebrities and athletes in real-time, high-energy workout sessions. 
                        No pre-recorded content - every session is live and exclusive.
                      </p>
                    </div>
                  </div>
                  <div className="group relative bg-gradient-to-br from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/25">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-orange-400 transition-colors">Interactive Q&A</h3>
                      <p className="text-gray-300 leading-relaxed text-lg">
                        Ask questions during sessions and get real-time feedback from celebrity trainers. 
                        Perfect your form and technique with direct guidance from the pros.
                      </p>
                    </div>
                  </div>
                  <div className="group relative bg-gradient-to-br from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/25">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-orange-400 transition-colors">Exclusive Access</h3>
                      <p className="text-gray-300 leading-relaxed text-lg">
                        Limited sessions with no replays or reruns. Show up or miss out on these once-in-a-lifetime 
                        training experiences with your fitness idols.
                      </p>
                    </div>
                  </div>
                  <div className="group relative bg-gradient-to-br from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/25">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
                      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-orange-400 transition-colors">Personalized Experience</h3>
                      <p className="text-gray-300 leading-relaxed text-lg">
                        Get personalized attention and motivation from celebrity trainers who understand your fitness goals 
                        and push you to achieve your personal best.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeModal === 'how-it-works' && (
                <div className="space-y-8">
                  <div className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-start gap-8">
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white w-20 h-20 rounded-3xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-orange-500/25 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">1</div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-orange-400 transition-colors">Join the Waitlist</h3>
                        <p className="text-gray-300 leading-relaxed text-xl">
                          Sign up to secure your spot in our exclusive live sessions. Be among the first to experience 
                          celebrity fitness training like never before.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-start gap-8">
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white w-20 h-20 rounded-3xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-orange-500/25 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">2</div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-orange-400 transition-colors">Get Notified</h3>
                        <p className="text-gray-300 leading-relaxed text-xl">
                          Receive exclusive notifications about upcoming sessions with your favorite celebrity trainers. 
                          Never miss an opportunity to train with the stars.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-start gap-8">
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white w-20 h-20 rounded-3xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-orange-500/25 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">3</div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-orange-400 transition-colors">Train Live</h3>
                        <p className="text-gray-300 leading-relaxed text-xl">
                          Join high-energy live workouts with celebrity trainers. Ask questions, get real-time feedback, 
                          and train alongside your fitness idols in exclusive sessions.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-start gap-8">
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white w-20 h-20 rounded-3xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-orange-500/25 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">4</div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-orange-400 transition-colors">Watch Your Gains</h3>
                        <p className="text-gray-300 leading-relaxed text-xl">
                          Track your progress and celebrate your transformation as you achieve the fitness goals 
                          you&apos;ve always dreamed of reaching with celebrity guidance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {activeModal === 'privacy' && (
                <div className="space-y-8">
                  <div className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <h3 className="text-3xl font-bold text-white mb-6">🔒 Privacy Policy</h3>
                      <p className="text-gray-300 leading-relaxed text-xl">
                        At CelebFitLife, we are committed to protecting your privacy and ensuring the security of your personal information.
                      </p>
                    </div>
                  </div>
                  <div className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <h4 className="text-2xl font-bold text-orange-400 mb-6">📊 Information We Collect</h4>
                      <p className="text-gray-300 leading-relaxed text-xl">
                        We collect information you provide directly to us, such as when you join our waitlist, including your email address 
                        and any other information you choose to provide.
                      </p>
                    </div>
                  </div>
                  <div className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <h4 className="text-2xl font-bold text-orange-400 mb-6">🎯 How We Use Your Information</h4>
                      <p className="text-gray-300 leading-relaxed text-xl">
                        We use the information we collect to send you notifications about upcoming live sessions, provide customer support, 
                        and improve our services.
                      </p>
                    </div>
                  </div>
                  <div className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <h4 className="text-2xl font-bold text-orange-400 mb-6">🛡️ Data Security</h4>
                      <p className="text-gray-300 leading-relaxed text-xl">
                        We implement appropriate security measures to protect your personal information against unauthorized access, 
                        alteration, disclosure, or destruction.
                      </p>
                    </div>
                  </div>
                  <div className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <h4 className="text-2xl font-bold text-orange-400 mb-6">📧 Contact Us</h4>
                      <p className="text-gray-300 leading-relaxed text-xl">
                        If you have any questions about this Privacy Policy, please contact us at privacy@celebfitlife.com
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeModal === 'terms' && (
                <div className="space-y-8">
                  <div className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <h3 className="text-3xl font-bold text-white mb-6">📋 Terms of Service</h3>
                      <p className="text-gray-300 leading-relaxed text-xl">
                        Welcome to CelebFitLife. These Terms of Service (&quot;Terms&quot;) govern your use of our platform and services.
                      </p>
                    </div>
                  </div>
                  <div className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <h4 className="text-2xl font-bold text-orange-400 mb-6">✅ Acceptance of Terms</h4>
                      <p className="text-gray-300 leading-relaxed text-xl">
                        By joining our waitlist or using our services, you agree to be bound by these Terms and our Privacy Policy.
                      </p>
                    </div>
                  </div>
                  <div className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <h4 className="text-2xl font-bold text-orange-400 mb-6">🎯 Live Sessions</h4>
                      <p className="text-gray-300 leading-relaxed text-xl">
                        Our live training sessions are exclusive and limited. Sessions are conducted on a first-come, first-served basis 
                        and may be subject to capacity limitations.
                      </p>
                    </div>
                  </div>
                  <div className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <h4 className="text-2xl font-bold text-orange-400 mb-6">🤝 User Conduct</h4>
                      <p className="text-gray-300 leading-relaxed text-xl">
                        Users must maintain respectful behavior during live sessions. Any inappropriate conduct may result in removal 
                        from the session and termination of access.
                      </p>
                    </div>
                  </div>
                  <div className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <h4 className="text-2xl font-bold text-orange-400 mb-6">⚠️ Limitation of Liability</h4>
                      <p className="text-gray-300 leading-relaxed text-xl">
                        CelebFitLife is not responsible for any injuries that may occur during training sessions. Users participate 
                        at their own risk and should consult with healthcare professionals before beginning any fitness program.
                      </p>
                    </div>
                  </div>
                  <div className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/40 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <h4 className="text-2xl font-bold text-orange-400 mb-6">📧 Contact Information</h4>
                      <p className="text-gray-300 leading-relaxed text-xl">
                        For questions about these Terms, please contact us at legal@celebfitlife.com
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
