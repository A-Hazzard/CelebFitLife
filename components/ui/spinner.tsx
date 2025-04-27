import { cn } from "@/lib/utils";
import React from "react";
import { SpinnerProps } from "@/lib/types/ui";

export const Spinner = ({
  size = "md",
  color = "primary",
  className,
  ...props
}: SpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  const colorClasses = {
    primary: "border-t-brandOrange",
    white: "border-t-white",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-solid border-t-solid border-brandGray",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      {...props}
    ></div>
  );
};
