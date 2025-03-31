import React from "react";

const Loader = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <div className="h-3 w-3 bg-brandOrange rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-3 w-3 bg-brandGray rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-3 w-3 bg-brandWhite rounded-full animate-bounce"></div>
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
