import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { BadgeProps } from "@/lib/types/ui";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-brandOrange px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 dark:border-brandGray dark:focus:ring-gray-300",
  {
    variants: {
      variant: {
        default: "bg-brandBlack text-brandWhite hover:bg-brandOrange border-transparent",
        secondary:
          "bg-brandGray text-brandWhite hover:bg-brandOrange border-transparent",
        destructive:
          "bg-brandOrange text-brandWhite hover:bg-brandOrange/80 border-transparent",
        outline: "text-brandGray border-brandGray",
        success:
          "bg-brandOrange text-brandWhite hover:bg-brandOrange/80 border-transparent",
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
