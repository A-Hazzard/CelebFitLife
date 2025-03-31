import { NextResponse } from "next/server";
import { TwilioService } from "@/app/api/lib/services/TwilioService";
import { ValidationError } from "@/app/api/lib/errors/apiErrors";

// Make sure this is a server-side route by using the 'use server' directive
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET handler for generating Twilio tokens for video rooms
 * This endpoint is used by the client-side Twilio service
 */
export async function GET(req: Request) {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 12);

  console.log(`[API:${requestId}] Twilio Token API called`);

  try {
    // Get streamId from the query params
    const { searchParams } = new URL(req.url);
    const streamId = searchParams.get("streamId");

    const countryCode = req.headers.get("cf-ipcountry") || "unknown";
    console.log(`[API:${requestId}] Request from region: ${countryCode}`);

    if (!streamId) {
      console.error(`[API:${requestId}] Missing required streamId parameter`);
      return NextResponse.json(
        {
          error: "Missing streamId parameter",
        },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Generate a generic viewer identity using a timestamp to ensure uniqueness
    const timestamp = Date.now();
    const viewerIdentity = `viewer_${timestamp}`;

    console.log(
      `[API:${requestId}] Generating Twilio token for room: ${streamId}, User: ${viewerIdentity}`
    );

    // TwilioService constructor validates env vars, throws Error if missing
    const twilioService = new TwilioService();
    const token = await twilioService.generateToken(streamId, viewerIdentity);

    const requestDuration = Date.now() - requestStartTime;
    console.log(
      `[API:${requestId}] Successfully generated token. Duration: ${requestDuration}ms`
    );

    // Return token response - simplified to match client expectations
    return NextResponse.json(
      {
        token,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
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

    return NextResponse.json(
      {
        error: errorMessage,
      },
      {
        status,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
