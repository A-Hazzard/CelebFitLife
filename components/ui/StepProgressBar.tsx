import React from "react";
import { motion } from "framer-motion";

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepNames?: string[];
}

export default function StepProgressBar({
  currentStep,
  totalSteps,
  stepNames = [],
}: StepProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">
          Step {currentStep} of {totalSteps}
        </span>
        {stepNames.length > 0 && currentStep <= stepNames.length && (
          <span className="text-sm text-gray-400">
            {stepNames[currentStep - 1]}
          </span>
        )}
      </div>

      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="bg-orange-500 h-2.5 rounded-full"
        />
      </div>
    </div>
  );
} 