import { NextResponse } from "next/server";
import { TwilioService } from "@/app/api/lib/services/TwilioService";
import { ValidationError } from "@/app/api/lib/errors/apiErrors";

// Make sure this is a server-side route by using the 'use server' directive
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Handler for generating Twilio tokens specifically for viewers
 * This endpoint supports both GET and POST methods for better compatibility
 */
async function handleTokenRequest(req: Request) {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 12);

  console.log(`[API:${requestId}] Twilio Viewer Token API called`);

  try {
    const countryCode = req.headers.get("cf-ipcountry") || "unknown";
    console.log(`[API:${requestId}] Request from region: ${countryCode}`);

    // Get roomName from either POST body or GET URL params
    let roomName: string | null = null;

    // Check if it's a POST with JSON body
    if (req.method === "POST") {
      try {
        const body = await req.json();
        roomName = body.roomName;
      } catch (error) {
        console.error(
          `[API:${requestId}] Failed to parse POST request body:`,
          error
        );
        // If JSON parsing fails, we'll check URL params next
      }
    }

    // If no roomName from POST body, try URL params (for GET requests or POST fallback)
    if (!roomName) {
      const url = new URL(req.url);
      roomName = url.searchParams.get("roomName");
    }

    // Validate roomName
    if (!roomName) {
      console.error(`[API:${requestId}] Missing required roomName parameter`);
      return NextResponse.json(
        {
          error: "Missing roomName parameter",
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
      `[API:${requestId}] Generating Twilio token for viewer in room: ${roomName}, Identity: ${viewerIdentity}`
    );

    // TwilioService constructor validates env vars, throws Error if missing
    const twilioService = new TwilioService();
    const token = await twilioService.generateToken(roomName, viewerIdentity);

    const requestDuration = Date.now() - requestStartTime;
    console.log(
      `[API:${requestId}] Successfully generated viewer token. Duration: ${requestDuration}ms`
    );

    // Return token response - simplified to match client expectations
    return NextResponse.json(
      {
        token,
        success: true,
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
      `[API:${requestId}] Error in Twilio viewer token API after ${requestDuration}ms:`,
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
        success: false,
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

/**
 * POST handler for generating Twilio tokens for viewers
 */
export async function POST(req: Request) {
  return handleTokenRequest(req);
}

/**
 * GET handler for generating Twilio tokens for viewers
 * Added for compatibility with clients that don't support POST
 */
export async function GET(req: Request) {
  return handleTokenRequest(req);
}
