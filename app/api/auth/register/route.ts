import { NextResponse } from "next/server";
import { AuthService } from "@/lib/services/AuthService";
import { UserCreateDTO } from "@/lib/models/User";
import { handleApiError } from "@/lib/utils/errorHandler";

// Make sure this is a server-side route by using the 'use server' directive
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();

    // Validate required fields
    if (!body.email || !body.username || !body.password) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 }
      );
    }

    // Create a DTO object
    const userData: UserCreateDTO = {
      email: body.email,
      username: body.username,
      password: body.password,
      age: body.age,
      city: body.city,
      country: body.country,
      phone: body.phone,
      role: body.role || { admin: false, streamer: false, viewer: true },
    };

    // Call the AuthService to register the user
    const authService = new AuthService();
    const user = await authService.register(userData);

    // Return success response
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
