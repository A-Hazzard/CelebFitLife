/**
 * Types for utility functions
 */

// --- Logger Types ---
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

export type LogData =
  | string
  | number
  | boolean
  | null
  | undefined
  | Error
  | Record<string, unknown>
  | Array<unknown>;

export type Logger = {
  trace: (message: string, ...args: LogData[]) => void;
  debug: (message: string, ...args: LogData[]) => void;
  info: (message: string, ...args: LogData[]) => void;
  warn: (message: string, ...args: LogData[]) => void;
  error: (message: string, ...args: LogData[]) => void;
  withContext: (context: string) => Logger;
};
 