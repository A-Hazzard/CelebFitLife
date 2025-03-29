import { NextResponse } from "next/server";
import { TwilioService } from "@/lib/services/TwilioService";
import { handleApiError } from "@/lib/utils/errorHandler";

// Make sure this is a server-side route by using the 'use server' directive
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST handler for generating Twilio tokens for video rooms
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate required fields
    const { roomName, userName } = body;
    if (!roomName || !userName) {
      return NextResponse.json(
        { error: "roomName and userName are required" },
        { status: 400 }
      );
    }

    // Create TwilioService and generate token
    const twilioService = new TwilioService();
    const token = await twilioService.generateToken(roomName, userName);

    // Return token response
    return NextResponse.json({
      token,
      identity: userName,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
