import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { BadgeProps } from "@/lib/types/ui";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 dark:border-gray-800 dark:focus:ring-gray-300",
  {
    variants: {
      variant: {
        default: "bg-gray-900 text-white hover:bg-gray-800 border-transparent",
        secondary:
          "bg-gray-800 text-gray-100 hover:bg-gray-700 border-transparent",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 border-transparent",
        outline: "text-gray-300 border-gray-700",
        success:
          "bg-green-500 text-white hover:bg-green-600 border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }: BadgeProps) {
  // Ensure variant is one of the allowed values
  const validVariant = variant as
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | undefined;

  return (
    <div
      className={cn(badgeVariants({ variant: validVariant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
