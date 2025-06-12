import { NextResponse } from "next/server";
import { MuxService } from "../../lib/services/MuxService";
import { ValidationError } from "../../lib/errors/apiErrors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST handler for creating new live streams
 */
export async function POST(req: Request) {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 12);

  console.log(`[API:${requestId}] Create Mux Live Stream API called`);

  try {
    const body = await req.json().catch(() => ({}));
    const { playbackPolicy = "public", recordingEnabled = true } = body;

    console.log(
      `[API:${requestId}] Creating live stream with policy: ${playbackPolicy}`
    );

    const muxService = new MuxService();
    const liveStream = await muxService.createLiveStream({
      playbackPolicy,
      newAssetSettings: recordingEnabled ? { playbackPolicy } : undefined,
    });

    const requestDuration = Date.now() - requestStartTime;
    console.log(
      `[API:${requestId}] Successfully created live stream. Duration: ${requestDuration}ms`
    );

    return NextResponse.json({
      success: true,
      liveStream,
      requestId,
      latency: requestDuration,
    });
  } catch (error: unknown) {
    const requestDuration = Date.now() - requestStartTime;
    console.error(
      `[API:${requestId}] Error creating live stream after ${requestDuration}ms:`,
      error
    );

    let errorMessage = "Failed to create live stream";
    let status = 500;

    if (error instanceof ValidationError) {
      errorMessage = error.message;
      status = 400;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        requestId,
        latency: requestDuration,
      },
      { status }
    );
  }
}

/**
 * GET handler for retrieving live streams
 */
export async function GET(req: Request) {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 12);

  console.log(`[API:${requestId}] Get Live Streams API called`);

  try {
    const url = new URL(req.url);
    const streamId = url.searchParams.get("streamId");

    const muxService = new MuxService();

    if (streamId) {
      // Get specific stream
      const liveStream = await muxService.getLiveStream(streamId);

      if (!liveStream) {
        // Do not log error for not found
        return NextResponse.json(
          {
            success: false,
            error: "Live stream not found",
            requestId,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        liveStream,
        requestId,
        latency: Date.now() - requestStartTime,
      });
    } else {
      // Get assets/recordings
      const assets = await muxService.getAssets();

      return NextResponse.json({
        success: true,
        assets,
        requestId,
        latency: Date.now() - requestStartTime,
      });
    }
  } catch (error: unknown) {
    const requestDuration = Date.now() - requestStartTime;
    console.error(
      `[API:${requestId}] Error retrieving data after ${requestDuration}ms:`,
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve live stream data",
        requestId,
        latency: requestDuration,
      },
      { status: 500 }
    );
  }
}
