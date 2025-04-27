import React from "react";
import { motion } from "framer-motion";
import { StepProgressBarProps } from "@/lib/types/ui";

export default function StepProgressBar({
  currentStep,
  totalSteps,
  stepNames = [],
}: StepProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-brandGray">
          Step {currentStep} of {totalSteps}
        </span>
        {stepNames.length > 0 && currentStep <= stepNames.length && (
          <span className="text-sm text-brandGray">
            {stepNames[currentStep - 1]}
          </span>
        )}
      </div>

      <div className="w-full bg-brandGray rounded-full h-2.5">
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
