import { NextResponse } from "next/server";
import { AuthService } from "@/lib/services/AuthService";
import { UserLoginDTO } from "@/lib/types/user";
import { handleApiError } from "@/lib/utils/errorHandler";
import { comparePasswords } from "@/lib/utils/authUtils";

// Make this a server-side route
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Test route to attempt login with the sample user credentials
 * This is for debugging purposes only and should be removed in production
 */
export async function GET(req: Request) {
  console.log("[TEST-LOGIN] Test login endpoint called");

  // The credentials from the image
  const email = "aaronhazzard2018@gmail.com";
  const storedHash = "$2a$10$9hfAGDehcQI/AST9doqngO3tc7TgA7sKWMVrAVAJI8zc5XGM";

  // Test if this is a valid bcrypt hash format
  console.log("[TEST-LOGIN] Testing stored hash format:");
  console.log(`  Hash length: ${storedHash.length}`);
  console.log(
    `  Hash starts with $2a$10$: ${storedHash.startsWith("$2a$10$")}`
  );

  // A complete bcrypt hash should be around 60 characters
  if (storedHash.length < 50) {
    console.log(
      "[TEST-LOGIN] WARNING: The stored hash appears to be incomplete or truncated"
    );
  }

  try {
    // Try to compare a test password with the hash to see if bcrypt functions properly
    try {
      console.log(
        "[TEST-LOGIN] Testing bcrypt compare function with sample password"
      );
      const testResult = await comparePasswords("test-password", storedHash);
      console.log(`[TEST-LOGIN] Bcrypt comparison result: ${testResult}`);
    } catch (bcryptError) {
      console.error("[TEST-LOGIN] Bcrypt comparison error:", bcryptError);
    }

    // First attempt: Try with the stored hash (which might be truncated)
    console.log("[TEST-LOGIN] Attempt 1: Using the stored hash from the image");
    const testCredentials1: UserLoginDTO = {
      email: email,
      password: storedHash,
    };

    // Second attempt: Try with a test password
    console.log("[TEST-LOGIN] Attempt 2: Using a plain test password");
    const testCredentials2: UserLoginDTO = {
      email: email,
      password: "password123",
    };

    const authService = new AuthService();

    // Log some diagnostic info about the database
    try {
      console.log("[TEST-LOGIN] Checking if user exists in database");
      const userService = authService["userService"];
      const user = await userService.findByEmail(email);
      console.log(`[TEST-LOGIN] User found: ${!!user}`);
      if (user) {
        console.log(`[TEST-LOGIN] User details:`, {
          email: user.email,
          hasPassword: !!user.password,
          passwordLength: user.password ? user.password.length : 0,
          passwordPrefix: user.password
            ? user.password.substring(0, 10) + "..."
            : "none",
        });
      }
    } catch (dbError) {
      console.error("[TEST-LOGIN] Error checking user in database:", dbError);
    }

    // Try attempt 1
    let result;
    try {
      console.log("[TEST-LOGIN] Running Attempt 1");
      const user = await authService.login(testCredentials1);
      console.log("[TEST-LOGIN] Attempt 1: Login successful");
      result = {
        success: true,
        message: "Test login successful with stored hash",
        user: { email: user.email, username: user.username },
      };
    } catch (loginError1) {
      console.error("[TEST-LOGIN] Attempt 1: Login failed:", loginError1);

      // Try attempt 2
      try {
        console.log("[TEST-LOGIN] Running Attempt 2");
        const user = await authService.login(testCredentials2);
        console.log("[TEST-LOGIN] Attempt 2: Login successful");
        result = {
          success: true,
          message: "Test login successful with plain password",
          user: { email: user.email, username: user.username },
        };
      } catch (loginError2) {
        console.error("[TEST-LOGIN] Attempt 2: Login failed:", loginError2);
        result = {
          success: false,
          message: "Both login attempts failed",
          errors: {
            attempt1:
              loginError1 instanceof Error
                ? loginError1.message
                : "Unknown error",
            attempt2:
              loginError2 instanceof Error
                ? loginError2.message
                : "Unknown error",
          },
        };
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[TEST-LOGIN] Unexpected error:", error);
    return handleApiError(error);
  }
}
