/**
 * STREAMING ERROR HANDLER
 *
 * This file contains utilities for handling various error types including Mux errors,
 * standard errors, and custom errors in a consistent way across the application.
 */

import {
  StreamingError,
  MuxStreamingError,
  StreamingErrorUnion,
} from "@/lib/types/streaming.types";

/**
 * Creates a standardized streaming error object
 */
export function createStreamingError(
  code: string,
  message: string,
  isRecoverable: boolean = true,
  context?: Record<string, unknown>
): StreamingError {
  return {
    code,
    message,
    isRecoverable,
    context,
  };
}

/**
 * Creates a Mux-specific streaming error
 */
export function createMuxError(
  code: string,
  message: string,
  muxErrorCode?: string,
  isRecoverable: boolean = true,
  context?: Record<string, unknown>
): MuxStreamingError {
  return {
    code,
    message,
    isRecoverable,
    context,
    muxError: true,
    muxErrorCode,
  };
}

/**
 * Handles various error types including Mux errors, standard errors, and custom errors
 *
 * @param error - The error to handle (can be various types)
 * @returns A standardized streaming error object
 */
export function handleStreamingError(error: unknown): StreamingErrorUnion {
  console.error("[ErrorHandler] Processing error:", error);

  // Handle null/undefined errors
  if (!error) {
    return createStreamingError(
      "UNKNOWN_ERROR",
      "An unknown error occurred",
      false
    );
  }

  // Check if it's already a streaming error
  if (
    typeof error === "object" &&
    "code" in error &&
    "message" in error &&
    "isRecoverable" in error
  ) {
    return error as StreamingErrorUnion;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for specific error patterns
    if (
      error.message.includes("permission") ||
      error.message.includes("Permission")
    ) {
      return createStreamingError(
        "MEDIA_PERMISSION_DENIED",
        "Permission denied to access camera or microphone. Please check your browser settings.",
        true,
        { originalError: error.message }
      );
    }

    if (
      error.message.includes("network") ||
      error.message.includes("Network")
    ) {
      return createStreamingError(
        "NETWORK_ERROR",
        "Network connection issue. Please check your internet connection.",
        true,
        { originalError: error.message }
      );
    }

    if (error.message.includes("mux") || error.message.includes("Mux")) {
      return createMuxError("MUX_ERROR", error.message, undefined, true, {
        originalError: error.message,
      });
    }

    // Generic error
    return createStreamingError("GENERIC_ERROR", error.message, true, {
      originalError: error.message,
    });
  }

  // Handle string errors
  if (typeof error === "string") {
    return createStreamingError("STRING_ERROR", error, true);
  }

  // Handle objects with error property
  if (typeof error === "object" && "error" in error) {
    const errorObj = error as { error: string; details?: string };
    return {
      error: errorObj.error,
      details: errorObj.details,
    };
  }

  // Fallback for unknown error types
  return createStreamingError(
    "UNKNOWN_ERROR",
    "An unexpected error occurred",
    false,
    { originalError: error }
  );
}

/**
 * Converts error codes into user-friendly messages
 */
export function getErrorMessage(error: StreamingErrorUnion): string {
  if ("error" in error) {
    return error.error;
  }

  if ("message" in error) {
    return error.message;
  }

  return "An unknown error occurred";
}

/**
 * Determines if an error is recoverable
 */
export function isRecoverableError(error: StreamingErrorUnion): boolean {
  if ("isRecoverable" in error) {
    return error.isRecoverable;
  }

  // Assume recoverable for simple error objects
  return true;
}

/**
 * Gets error context for debugging
 */
export function getErrorContext(
  error: StreamingErrorUnion
): Record<string, unknown> | undefined {
  if ("context" in error) {
    return error.context;
  }

  return undefined;
}

/**
 * Formats error for logging
 */
export function formatErrorForLogging(error: StreamingErrorUnion): string {
  const message = getErrorMessage(error);
  const recoverable = isRecoverableError(error);
  const context = getErrorContext(error);

  let logMessage = `Error: ${message} (Recoverable: ${recoverable})`;

  if (context) {
    logMessage += ` Context: ${JSON.stringify(context)}`;
  }

  return logMessage;
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use handleStreamingError instead
 */
export const toStreamingError = handleStreamingError;
