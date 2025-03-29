import { NextResponse } from "next/server";

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
