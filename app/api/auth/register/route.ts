import { NextResponse } from "next/server";
import { RegisterService } from "../../lib/services/RegisterService";
import { ValidationError, UserExistsError } from "../../lib/errors/apiErrors";

// Make sure this is a server-side route by using the 'use server' directive
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const registerService = new RegisterService();

  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("[SERVER] Registration request body:", {
        username: body.username,
        email: body.email?.substring(0, 3) + "...",
        hasPassword: !!body.password,
        role: body.role,
        age: body.age
      });
    } catch (err) {
      console.error("[SERVER] Failed to parse JSON:", err);
      return NextResponse.json(
        { success: false, error: "Invalid JSON data" },
        { status: 400 }
      );
    }

    // 1. Validate input - this throws ValidationError for invalid data
    let validatedData;
    try {
      validatedData = registerService.validateInput(body);
      console.log("[SERVER] Validated registration data:", {
        username: validatedData.username,
        email: validatedData.email?.substring(0, 3) + "...",
        role: validatedData.role
      });
    } catch (validationErr) {
      console.error("[SERVER] Validation error:", validationErr);
      throw validationErr;
    }

    // 2. Register the user - this may throw UserExistsError
    let user;
    try {
      user = await registerService.registerUser(validatedData);
      console.log("[SERVER] User registered successfully:", user.id);
    } catch (registerErr) {
      console.error("[SERVER] User registration error:", registerErr);
      throw registerErr;
    }

    // 3. Return success response
    return NextResponse.json(
      {
        success: true,
        user: {
          uid: user.id,
          email: user.email,
          username: user.username,
          age: user.age,
          city: user.city,
          country: user.country,
          phone: user.phone,
          role: user.role,
          isStreamer: user.role?.streamer || false,
          isAdmin: user.isAdmin || false,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SERVER] Registration error:", error);

    let errorMessage = "An internal server error occurred";
    let status = 500;

    if (error instanceof ValidationError) {
      errorMessage = error.message;
      status = 400; // Bad Request
    } else if (error instanceof UserExistsError) {
      errorMessage = error.message;
      status = 409; // Conflict
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}
