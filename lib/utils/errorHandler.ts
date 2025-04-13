import { NextResponse } from "next/server";
import { TwilioError } from "twilio-video";
import {
  StreamingErrorType,
  UnknownError,
  TwilioStreamingError,
  NetworkError,
} from "@/lib/types/streaming.types";

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  const message =
    error instanceof Error ? error.message : "An unknown error occurred";
  return NextResponse.json({ error: message }, { status: 500 });
}

export const ErrorTypes = {
  NOT_FOUND: (resource: string) => new ApiError(`${resource} not found`, 404),
  UNAUTHORIZED: (message = "Unauthorized access") => new ApiError(message, 401),
  FORBIDDEN: (message = "Forbidden") => new ApiError(message, 403),
  BAD_REQUEST: (message: string) => new ApiError(message, 400),
  CONFLICT: (message: string) => new ApiError(message, 409),
  INTERNAL_SERVER: (message = "Internal server error") =>
    new ApiError(message, 500),
  VALIDATION: (message: string) => new ApiError(message, 422),
};

/**
 * Converts an unknown error to a StreamingErrorType
 * Handles various error types including Twilio errors, standard errors, and custom errors
 */
export function toStreamingError(error: unknown): StreamingErrorType {
  if (!error) {
    return {
      name: "UnknownError",
      message: "An unknown error occurred",
      unknownError: true,
    };
  }

  // Return as is if it's already a StreamingError
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    "message" in error
  ) {
    // Check if it's already one of our specific error types
    if (
      "twilioError" in error ||
      "domError" in error ||
      "deviceError" in error ||
      "trackError" in error ||
      "networkError" in error ||
      "firestoreError" in error
    ) {
      return error as StreamingErrorType;
    }

    // If it's a TwilioError, convert it
    if (error instanceof TwilioError) {
      const twilioStreamingError: TwilioStreamingError = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        twilioError: true,
      };
      return twilioStreamingError;
    }

    // For standard Error objects
    if (error instanceof Error) {
      const unknownError: UnknownError = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        unknownError: true,
      };

      // Check for network errors
      if (
        error.message.includes("network") ||
        error.message.includes("connection") ||
        error.message.includes("offline") ||
        error.message.includes("internet")
      ) {
        const networkError: NetworkError = {
          ...unknownError,
          networkError: true,
        };
        return networkError;
      }

      return unknownError;
    }
  }

  // For string errors
  if (typeof error === "string") {
    return {
      name: "StringError",
      message: error,
      unknownError: true,
    };
  }

  // Fallback for truly unknown errors
  return {
    name: "UnknownError",
    message: "Unknown error type: " + typeof error,
    unknownError: true,
  };
}
