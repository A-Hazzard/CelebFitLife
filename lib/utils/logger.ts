/**
 * Application logging utilities
 *
 * Provides a consistent logging interface with context tracking
 * and environment-specific behavior.
 */

type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

// Define types for log data rather than using any
type LogData =
  | string
  | number
  | boolean
  | null
  | undefined
  | Error
  | Record<string, unknown>
  | Array<unknown>;

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

// Set default minimum level based on environment
const DEFAULT_LOG_LEVEL: LogLevel =
  process.env.NODE_ENV === "production" ? "info" : "debug";

// Gets the current minimum log level (can be overridden by localStorage in browser)
function getMinLogLevel(): LogLevel {
  if (typeof window !== "undefined") {
    try {
      const storedLevel = localStorage.getItem("logLevel") as LogLevel | null;
      if (storedLevel && LOG_LEVELS[storedLevel] !== undefined) {
        return storedLevel;
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  return DEFAULT_LOG_LEVEL;
}

interface Logger {
  trace: (message: string, ...args: LogData[]) => void;
  debug: (message: string, ...args: LogData[]) => void;
  info: (message: string, ...args: LogData[]) => void;
  warn: (message: string, ...args: LogData[]) => void;
  error: (message: string, ...args: LogData[]) => void;
  withContext: (context: string) => Logger;
}

/**
 * Creates a logger instance with the given module name
 */
export function createLogger(module: string): Logger {
  const createLogMethod = (level: LogLevel) => {
    return (message: string, ...args: LogData[]) => {
      const minLevel = getMinLogLevel();

      if (LOG_LEVELS[level] >= LOG_LEVELS[minLevel]) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module}]`;

        if (args.length > 0) {
          console[level === "trace" ? "debug" : level](
            `${prefix} ${message}`,
            ...args
          );
        } else {
          console[level === "trace" ? "debug" : level](`${prefix} ${message}`);
        }
      }
    };
  };

  return {
    trace: createLogMethod("trace"),
    debug: createLogMethod("debug"),
    info: createLogMethod("info"),
    warn: createLogMethod("warn"),
    error: createLogMethod("error"),
    withContext: (context: string) => createLogger(`${module}:${context}`),
  };
}
