import React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const Loader = ({ className, ...props }: LoaderProps) => {
  return (
    <div
      className={cn("flex justify-center items-center", className)}
      {...props}
    >
      <div className="relative">
        {/* Outer ring with pulse animation */}
        <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-brandOrange opacity-20 animate-spin"></div>

        {/* Middle ring with pulse animation */}
        <div
          className="absolute inset-1 rounded-full border-t-2 border-b-2 border-brandOrange opacity-40 animate-spin"
          style={{ animationDuration: "1.2s" }}
        ></div>

        {/* Inner dot with pulse effect */}
        <div className="h-8 w-8 rounded-full flex items-center justify-center">
          <div className="h-2 w-2 bg-brandOrange rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;

// Add keyframes for bounce animation in tailwind.config.ts if not already present
// keyframes: {
//   bounce: {
//     '0%, 100%': {
//       transform: 'translateY(-25%)',
//       animationTimingFunction: 'cubic-bezier(0.8,0,1,1)',
//     },
//     '50%': {
//       transform: 'none',
//       animationTimingFunction: 'cubic-bezier(0,0,0.2,1)',
//     },
//   },
// },
// animation: {
//   bounce: 'bounce 1s infinite',
// },
