import { NextResponse } from "next/server";
import { LoginService } from "../../lib/services/LoginService";
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  InvalidDataError,
} from "../../lib/errors/apiErrors";

// Main POST request handler
export async function POST(request: Request) {
  const loginService = new LoginService();

  try {
    const body = await request.json();

    // 1. Validate Input
    const { email, password } = loginService.validateInput(body);

    // 2. Find User
    const { userDoc, userData } = await loginService.findUser(email);

    // 3. Verify Password
    await loginService.verifyPassword(password, userData.password);

    // 4. Create Session Token
    const token = await loginService.createSessionToken(email, userData);

    // 5. Prepare User Data for Response
    const user = loginService.prepareUserData(userDoc, userData);

    // 6. Create Success Response and Set Cookie
    const response = NextResponse.json({
      success: true,
      user,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure cookie in production
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days expiration
      sameSite: "lax", // Recommended for security
    });

    return response;
  } catch (error: unknown) {
    // Centralized error handling
    console.error("Login Process Error:", error); // Log the actual error details

    let errorMessage = "An unexpected error occurred.";
    let status = 500; // Default to Internal Server Error

    if (error instanceof ValidationError) {
      errorMessage = error.message;
      status = 400; // Bad Request
    } else if (error instanceof NotFoundError) {
      errorMessage = error.message;
      status = 404; // Not Found
    } else if (error instanceof AuthenticationError) {
      errorMessage = error.message;
      status = 401; // Unauthorized
    } else if (error instanceof InvalidDataError) {
      // For InvalidDataError, return a generic server error to the client
      // but the specific error is logged above for internal diagnostics.
      errorMessage = "Internal server error processing user data.";
      status = 500;
    } else if (error instanceof Error) {
      // Catch any other generic errors
      errorMessage = "Internal Server Error. Please try again later.";
    }
    // For unknown non-Error types (less common in TS if handled well)
    // else { } // Keep the default message and status

    // Return standardized error response
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}
