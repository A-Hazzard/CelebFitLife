import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DebounceFunction } from "@/lib/types/componentProps";

/**
 * Merges class names using clsx and tailwind-merge
 * This utility is used for conditional class merging with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a debounced version of the provided function
 * @param func - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce: DebounceFunction = (func, delay) => {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = function (this: unknown, ...args: unknown[]) {
    clearTimeout(timer);
    timer = setTimeout(
      () => func.apply(this, args as Parameters<typeof func>),
      delay
    );
  } as typeof func & { cancel?: () => void };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
};

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
