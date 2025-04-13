/**
 * Type definitions for UI components
 */
// Remove the unused import
// import { VariantProps } from "class-variance-authority";

// Define the specific badge variant options explicitly
export type BadgeVariantProps = {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success";
};

export type ButtonVariantProps = {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
};
