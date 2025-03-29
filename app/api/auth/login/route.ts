import { NextResponse } from "next/server";
import { AuthService } from "@/lib/services/AuthService";
import { UserLoginDTO } from "@/lib/models/User";
import { handleApiError } from "@/lib/utils/errorHandler";

// Make sure this is a server-side route by using the 'use server' directive
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Create a DTO object
    const credentials: UserLoginDTO = {
      email: body.email,
      password: body.password,
    };

    // Call the AuthService to login the user
    const authService = new AuthService();
    const user = await authService.login(credentials);

    // Create response with token in body
    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}
