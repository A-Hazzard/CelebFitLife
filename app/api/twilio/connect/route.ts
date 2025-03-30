import { NextResponse } from "next/server";
import { TwilioService } from "@/lib/services/TwilioService";
import { handleApiError, ApiError } from "@/lib/utils/errorHandler";

// Make sure this is a server-side route by using the 'use server' directive
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST handler for generating Twilio tokens for video rooms
 */
export async function POST(req: Request) {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 12);

  console.log(`[API:${requestId}] Twilio Connect API called`);

  try {
    // Get region information from headers if available
    const countryCode = req.headers.get("cf-ipcountry") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    console.log(`[API:${requestId}] Request from region: ${countryCode}`);
    console.log(`[API:${requestId}] User-Agent: ${userAgent}`);

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error(`[API:${requestId}] Failed to parse request body:`, error);
      return NextResponse.json(
        {
          error: "Invalid JSON body",
          details: "The request body could not be parsed as JSON",
          requestId: requestId,
        },
        { status: 400 }
      );
    }

    // Validate required fields
    const { roomName, userName } = body;
    if (!roomName || !userName) {
      console.error(`[API:${requestId}] Missing required fields:`, {
        roomName,
        userName,
      });
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: `roomName${!roomName ? " (missing)" : ""} and userName${
            !userName ? " (missing)" : ""
          } are required`,
          requestId: requestId,
        },
        { status: 400 }
      );
    }

    console.log(
      `[API:${requestId}] Generating Twilio token for room: ${roomName}`
    );
    console.log(`[API:${requestId}] User: ${userName}`);
    console.log(`[API:${requestId}] Region: ${countryCode}`);

    // Validate environment variables
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_API_KEY_SID ||
      !process.env.TWILIO_API_KEY_SECRET
    ) {
      console.error(`[API:${requestId}] Missing Twilio environment variables`);
      throw new ApiError(
        "Server configuration error - missing Twilio credentials",
        500
      );
    }

    // Create TwilioService and generate token
    try {
      const twilioService = new TwilioService();
      const token = await twilioService.generateToken(roomName, userName);

      const requestDuration = Date.now() - requestStartTime;
      console.log(
        `[API:${requestId}] Successfully generated token for room: ${roomName}`
      );
      console.log(`[API:${requestId}] User: ${userName}`);
      console.log(`[API:${requestId}] Duration: ${requestDuration}ms`);

      // Return token response
      return NextResponse.json({
        token,
        identity: userName,
        status: "success",
        region: countryCode,
        requestId: requestId,
        latency: requestDuration,
      });
    } catch (twilioError) {
      console.error(
        `[API:${requestId}] Error generating Twilio token:`,
        twilioError
      );
      throw new ApiError(
        `Failed to generate Twilio token: ${
          twilioError instanceof Error ? twilioError.message : "Unknown error"
        }`,
        500
      );
    }
  } catch (error) {
    const requestDuration = Date.now() - requestStartTime;
    console.error(
      `[API:${requestId}] Error in Twilio connect API after ${requestDuration}ms:`,
      error
    );

    // Add request ID to the error response
    const response = handleApiError(error);

    // Parse the response to add the request ID
    const body = await response.json();
    return NextResponse.json(
      {
        ...body,
        requestId: requestId,
        latency: requestDuration,
      },
      { status: response.status }
    );
  }
}
