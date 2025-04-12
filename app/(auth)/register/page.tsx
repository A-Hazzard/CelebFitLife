"use client";


import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import BasicInfo from "./steps/BasicInfo";
import SelectPlan from "./steps/SelectPlan";
import Payment from "./steps/Payment";
import SelectStreamers from "./steps/SelectStreamers";
import { useSignupStore } from "@/lib/store/useSignupStore";
import fitImage from "@/public/fitness.png";
import Image from "next/image";

// Enhanced Progress Bar Component
const ProgressBar = ({ step, totalSteps }: { step: number; totalSteps: number }) => {
  return (
    <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
      <motion.div 
        className="bg-gradient-to-r from-orange-500 to-orange-400 h-2.5 rounded-full"
        initial={{ width: "0%" }}
        animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
    </div>
  );
};

export default function Register() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center py-10 px-4">
      <RegisterPageContent />
    </main>
  );
}

function RegisterPageContent() {
  const { step } = useSignupStore();

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <BasicInfo />;
      case 1:
        return <SelectPlan />;
      case 2:
        return <Payment />;
      case 3:
        return <SelectStreamers />;
      default:
        return <BasicInfo />;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 0:
        return "Create your account";
      case 1:
        return "Choose your subscription";
      case 2:
        return "Payment details";
      case 3:
        return "Choose your favorite streamers";
      default:
        return "Register";
    }
  };

  return (
    <motion.div
      className="w-full max-w-5xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="w-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-b from-gray-800 to-gray-900 backdrop-blur-lg border border-gray-700">
        <div className="flex flex-col md:flex-row">
          {/* Left Side - Image */}
          <div className="md:w-2/5 relative overflow-hidden h-[230px] md:h-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
            <Image
              src={fitImage.src}
              alt="Fitness"
              fill
              className="absolute inset-0 object-cover"
              priority
            />
            <div className="absolute inset-0 flex flex-col justify-between p-8 z-20">
              <Link 
                href="/" 
                className="text-white flex items-center text-sm hover:text-orange-500 transition w-max group"
              >
                <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to home
              </Link>
              
              <div className="mb-8">
                <h2 className="text-orange-500 font-bold text-3xl mb-3">CelebFit Life</h2>
                <p className="text-gray-300 text-sm max-w-xs leading-relaxed">
                  Join our community and train with your favorite fitness streamers. Get personalized workouts and live coaching sessions.
                </p>
              </div>
            </div>
          </div>
          
          {/* Right Side - Form */}
          <div className="md:w-3/5 p-8 md:p-10">
            <div className="mb-8">
              <motion.h1 
                key={step}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-3xl font-bold text-white mb-3"
              >
                {getStepTitle()}
              </motion.h1>
              <p className="text-gray-400 text-sm">
                {step === 0 ? (
                  <>
                    Already have an account?{" "}
                    <Link href="/login" className="text-orange-500 hover:underline">
                      Login here
                    </Link>
                  </>
                ) : (
                  `Step ${step + 1} of 4`
                )}
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-8">
              <ProgressBar step={step} totalSteps={4} />
            </div>
            
            {/* Step Content */}
            <motion.div 
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="mt-6"
            >
              {renderStep()}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}