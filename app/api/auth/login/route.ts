import { NextResponse } from "next/server";
import { AuthService } from "@/lib/services/AuthService";
import { UserLoginDTO } from "@/lib/models/User";
import { handleApiError } from "@/lib/utils/errorHandler";

// DTO (Data Transfer Object)

// Make sure this is a server-side route by using the 'use server' directive
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const credentials: UserLoginDTO = {
      email: body.email,
      password: body.password,
    };

    const authService = new AuthService();
    const user = await authService.login(credentials);

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}
