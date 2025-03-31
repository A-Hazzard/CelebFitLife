import { NextResponse } from "next/server";
import { TwilioService } from "../../lib/services/TwilioService";
import { ValidationError } from "../../lib/errors/apiErrors";

// Make sure this is a server-side route by using the 'use server' directive
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Interface for token request body
 */
interface TokenRequestBody {
  roomName: string;
  identity: string;
}

/**
 * Interface for token response
 */
interface TokenResponseSuccess {
  success: boolean;
  token: string;
  identity: string;
  roomName: string;
  expiration: number;
  requestId: string;
  latency: number;
}

/**
 * Interface for token error response
 */
interface TokenResponseError {
  success: boolean;
  error: string;
  details?: string;
  requestId: string;
  latency?: number;
}

/**
 * POST handler for generating Twilio tokens for video rooms
 */
export async function POST(req: Request) {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 12);

  console.log(`[API:${requestId}] Twilio Token API called`);

  try {
    const countryCode = req.headers.get("cf-ipcountry") || "unknown";
    console.log(`[API:${requestId}] Request from region: ${countryCode}`);

    let body: TokenRequestBody;
    try {
      body = await req.json();
    } catch (error) {
      console.error(`[API:${requestId}] Failed to parse request body:`, error);
      return NextResponse.json<TokenResponseError>(
        {
          success: false,
          error: "Invalid JSON body",
          details: "The request body could not be parsed as JSON",
          requestId: requestId,
        },
        { status: 400 }
      );
    }

    const { roomName, identity } = body;
    if (!roomName || !identity) {
      const missingFields = [];
      if (!roomName) missingFields.push("roomName");
      if (!identity) missingFields.push("identity");
      console.error(
        `[API:${requestId}] Missing required fields: ${missingFields.join(
          ", "
        )}`
      );
      return NextResponse.json<TokenResponseError>(
        {
          success: false,
          error: "Missing required fields",
          details: `The following fields are required: ${missingFields.join(
            ", "
          )}`,
          requestId: requestId,
        },
        { status: 400 }
      );
    }

    console.log(
      `[API:${requestId}] Generating Twilio token for room: ${roomName}, Identity: ${identity}`
    );

    // TwilioService constructor validates env vars, throws Error if missing
    const twilioService = new TwilioService();
    const token = await twilioService.generateToken(roomName, identity);
    const expirationTime = twilioService.getTokenExpiration();

    const requestDuration = Date.now() - requestStartTime;
    console.log(
      `[API:${requestId}] Successfully generated token. Duration: ${requestDuration}ms`
    );

    // Return token response
    return NextResponse.json<TokenResponseSuccess>({
      success: true,
      token,
      identity,
      roomName,
      expiration: expirationTime,
      requestId: requestId,
      latency: requestDuration,
    });
  } catch (error: unknown) {
    const requestDuration = Date.now() - requestStartTime;
    console.error(
      `[API:${requestId}] Error in Twilio token API after ${requestDuration}ms:`,
      error
    );

    let errorMessage = "An internal server error occurred.";
    let status = 500;

    if (error instanceof ValidationError) {
      errorMessage = error.message;
      status = 400; // Bad Request for validation errors
    } else if (error instanceof Error) {
      // For standard errors (like config issues from TwilioService or SDK errors)
      // Keep the status as 500 but use the error message
      errorMessage = error.message;
    }
    // else {} // Keep default message and status for non-Error types

    return NextResponse.json<TokenResponseError>(
      {
        success: false,
        error: errorMessage,
        requestId: requestId,
        latency: requestDuration,
      },
      { status }
    );
  }
}
