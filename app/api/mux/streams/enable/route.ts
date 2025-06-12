import { NextRequest, NextResponse } from "next/server";
import Mux from "@mux/mux-node";

export const dynamic = "force-dynamic";

function getMuxClient() {
  const tokenId = process.env.MUX_ACCESS_TOKEN_ID;
  const tokenSecret = process.env.MUX_SECRET_KEY;

  if (!tokenId || !tokenSecret) {
    throw new Error(
      "MUX_ACCESS_TOKEN_ID and MUX_SECRET_KEY environment variables are required"
    );
  }

  return new Mux({
    tokenId: tokenId,
    tokenSecret: tokenSecret,
  });
}

/**
 * POST handler to enable a Mux live stream
 * This allows the stream to accept incoming RTMP connections
 */
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const streamId = searchParams.get("streamId");

  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 12);

  console.log(
    `[Mux-Enable:${requestId}] Attempting to enable stream: ${streamId}`
  );

  if (!streamId) {
    return NextResponse.json(
      {
        success: false,
        error: "Stream ID is required",
        requestId,
      },
      { status: 400 }
    );
  }

  try {
    const mux = getMuxClient();
    await mux.video.liveStreams.enable(streamId);

    const requestDuration = Date.now() - requestStartTime;

    console.log(
      `[Mux-Enable:${requestId}] Successfully enabled stream ${streamId} in ${requestDuration}ms`
    );

    return NextResponse.json({
      success: true,
      streamId,
      message: "Live stream enabled successfully",
      requestId,
      latency: requestDuration,
    });
  } catch (error: unknown) {
    const requestDuration = Date.now() - requestStartTime;
    console.error(
      `[Mux-Enable:${requestId}] Error enabling stream ${streamId} after ${requestDuration}ms:`,
      error
    );

    let errorMessage = "Failed to enable live stream";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes("not found")) {
        statusCode = 404;
        errorMessage = "Live stream not found";
      } else if (error.message.includes("already enabled")) {
        statusCode = 409;
        errorMessage = "Live stream is already enabled";
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        requestId,
        latency: requestDuration,
      },
      { status: statusCode }
    );
  }
}
