/**
 * Type for a debounce function
 * Accepts a function and a delay, returns a debounced version of the function
 */
export type DebounceFunction = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
) => T;
