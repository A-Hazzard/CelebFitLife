import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names using clsx and tailwind-merge
 * This utility is used for conditional class merging with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utils organization pattern:
 * - Type definitions are strictly kept in lib/types directory
 * - Utility functions are kept in lib/utils directory
 * - API and business logic helpers are kept in lib/helpers directory
 */

// Re-export other utilities
export * from "./validation";
export * from "./typeChecking";
export * from "./errorHandler";
export * from "./paymentUtils";
