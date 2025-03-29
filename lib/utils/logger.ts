/** Signature of a logging function */
export interface LogFn {
  (message?: unknown, ...optionalParams: unknown[]): void;
}

/** Basic logger interface */
export interface Logger {
  log: LogFn;
  warn: LogFn;
  error: LogFn;
  debug: LogFn;
  info: LogFn;
  trace: LogFn;
}

/** Log levels */
export type LogLevel = "debug" | "info" | "log" | "warn" | "error" | "none";

// No-operation function when logging is disabled
const NO_OP: LogFn = (/* message */): void => {};

// Timestamps for log messages
const getTimestamp = (): string => {
  return new Date().toISOString().substring(11, 23);
};

// Format a log message with contextual information
const formatMessage = (context: string, message: unknown): string => {
  if (typeof message === "string") {
    return `[${getTimestamp()}][${context}] ${message}`;
  }
  return String(message);
};

/**
 * Configurable logger which outputs to the browser console
 * Allows for setting different log levels and adding context to logs
 */
export class StreamingLogger implements Logger {
  readonly debug: LogFn;
  readonly info: LogFn;
  readonly log: LogFn;
  readonly warn: LogFn;
  readonly error: LogFn;
  readonly trace: LogFn;
  readonly context: string;

  constructor(options?: { level?: LogLevel; context?: string }) {
    const { level = "log", context = "Stream" } = options || {};
    this.context = context;

    // Always enable error logging unless explicitly disabled
    this.error = (message?: unknown, ...optionalParams: unknown[]): void =>
      console.error(formatMessage(this.context, message), ...optionalParams);

    if (level === "none") {
      this.warn = NO_OP;
      this.log = NO_OP;
      this.info = NO_OP;
      this.debug = NO_OP;
      this.trace = NO_OP;
      return;
    }

    this.warn = (message?: unknown, ...optionalParams: unknown[]): void =>
      console.warn(formatMessage(this.context, message), ...optionalParams);

    if (level === "error") {
      this.log = NO_OP;
      this.info = NO_OP;
      this.debug = NO_OP;
      this.trace = NO_OP;
      return;
    }

    this.log = (message?: unknown, ...optionalParams: unknown[]): void =>
      console.log(formatMessage(this.context, message), ...optionalParams);

    if (level === "warn") {
      this.info = NO_OP;
      this.debug = NO_OP;
      this.trace = NO_OP;
      return;
    }

    this.info = (message?: unknown, ...optionalParams: unknown[]): void =>
      console.info(formatMessage(this.context, message), ...optionalParams);

    if (level === "log") {
      this.debug = NO_OP;
      this.trace = NO_OP;
      return;
    }

    this.debug = (message?: unknown, ...optionalParams: unknown[]): void =>
      console.debug(formatMessage(this.context, message), ...optionalParams);

    if (level === "info") {
      this.trace = NO_OP;
      return;
    }

    // Only for "debug" level
    this.trace = (message?: unknown, ...optionalParams: unknown[]): void => {
      console.groupCollapsed(formatMessage(this.context, message));
      console.trace(...optionalParams);
      console.groupEnd();
    };
  }

  // Create a sub-logger with a more specific context
  withContext(subContext: string): StreamingLogger {
    return new StreamingLogger({
      level: this.getLevel(),
      context: `${this.context}:${subContext}`,
    });
  }

  // Get the current log level based on enabled methods
  private getLevel(): LogLevel {
    if (this.trace !== NO_OP) return "debug";
    if (this.debug !== NO_OP) return "info";
    if (this.info !== NO_OP) return "log";
    if (this.log !== NO_OP) return "warn";
    if (this.warn !== NO_OP) return "error";
    return "none";
  }
}

// Determine app environment
const isProduction = process.env.NODE_ENV === "production";

// Create default logger based on environment
export const createLogger = (context?: string): StreamingLogger => {
  return new StreamingLogger({
    level: isProduction ? "warn" : "debug",
    context: context || "App",
  });
};

// Default app-wide logger
export const logger = createLogger();
