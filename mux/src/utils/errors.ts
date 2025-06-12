/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  public statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Express error handler middleware
 */
export function errorHandler(
  err: Error | ValidationError | ApiError,
  _req: any,
  res: any,
  _next: any
): void {
  console.error('[Error Handler]', err);

  const statusCode = 
    (err as ValidationError | ApiError).statusCode || 500;
  
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}