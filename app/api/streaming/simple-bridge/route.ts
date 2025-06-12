import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Simple streaming bridge that simulates video streaming to Mux
 * This is a fallback for environments where FFmpeg is not available
 */

// Store active streaming sessions
const activeSessions = new Map<
  string,
  {
    streamKey: string;
    startTime: number;
    chunkCount: number;
    totalSize: number;
    lastChunkTime: number;
  }
>();

/**
 * POST handler for receiving video chunks
 */
export async function POST(req: NextRequest) {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 12);

  console.log(`[Simple-Bridge:${requestId}] Received chunk`);

  try {
    let chunk: Blob | null = null;
    let streamKey: string = "";
    let chunkSize = 0;
    let mimeType = "";

    // Handle both FormData and JSON payloads
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // Handle JSON payload (base64 encoded)
      const jsonData = await req.json();
      streamKey = jsonData.streamKey;
      const base64Chunk = jsonData.chunk;
      chunkSize = jsonData.size || 0;
      mimeType = jsonData.mimeType || "video/webm";

      // Convert base64 back to blob for processing
      const binaryString = atob(base64Chunk);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      chunk = new Blob([bytes], { type: mimeType });
    } else {
      // Handle FormData payload
      const formData = await req.formData();
      chunk = formData.get("chunk") as File;
      streamKey = formData.get("streamKey") as string;
      chunkSize = chunk?.size || 0;
      mimeType = chunk?.type || "video/webm";
    }

    if (!chunk || !streamKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing chunk or streamKey",
          requestId,
        },
        { status: 400 }
      );
    }

    // Track session
    if (!activeSessions.has(streamKey)) {
      activeSessions.set(streamKey, {
        streamKey,
        startTime: Date.now(),
        chunkCount: 0,
        totalSize: 0,
        lastChunkTime: Date.now(),
      });
      console.log(
        `[Simple-Bridge:${requestId}] Started new session for stream: ${streamKey}`
      );
    }

    const session = activeSessions.get(streamKey)!;
    session.chunkCount++;
    session.totalSize += chunkSize;
    session.lastChunkTime = Date.now();

    // Simulate processing the chunk
    console.log(`[Simple-Bridge:${requestId}] Processing chunk:`, {
      streamKey: streamKey.substring(0, 8) + "...",
      chunkSize,
      chunkCount: session.chunkCount,
      totalSize: session.totalSize,
      mimeType,
      sessionDuration: Date.now() - session.startTime,
    });

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 5));

    const requestDuration = Date.now() - requestStartTime;

    return NextResponse.json({
      success: true,
      requestId,
      latency: requestDuration,
      chunkSize,
      chunkCount: session.chunkCount,
      totalSize: session.totalSize,
      sessionDuration: Date.now() - session.startTime,
      message: `Chunk ${session.chunkCount} processed successfully (${(
        chunkSize / 1024
      ).toFixed(1)}KB)`,
    });
  } catch (error: unknown) {
    const requestDuration = Date.now() - requestStartTime;
    console.error(
      `[Simple-Bridge:${requestId}] Error processing chunk after ${requestDuration}ms:`,
      error
    );

    let errorMessage = "Failed to process video chunk";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        requestId,
        latency: requestDuration,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for stopping streams
 */
export async function DELETE(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 12);

  try {
    const { searchParams } = new URL(req.url);
    const streamKey = searchParams.get("streamKey");

    if (!streamKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing streamKey parameter",
          requestId,
        },
        { status: 400 }
      );
    }

    const session = activeSessions.get(streamKey);
    if (session) {
      const sessionStats = {
        duration: Date.now() - session.startTime,
        totalChunks: session.chunkCount,
        totalSize: session.totalSize,
        avgChunkSize: session.totalSize / session.chunkCount,
      };

      console.log(
        `[Simple-Bridge:${requestId}] Stopping session for stream: ${streamKey}`,
        sessionStats
      );
      activeSessions.delete(streamKey);
    }

    return NextResponse.json({
      success: true,
      message: "Stream session stopped",
      requestId,
    });
  } catch (error: unknown) {
    console.error(`[Simple-Bridge:${requestId}] Error stopping stream:`, error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to stop stream session",
        requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for checking session status
 */
export async function GET(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 12);

  try {
    const { searchParams } = new URL(req.url);
    const streamKey = searchParams.get("streamKey");

    if (streamKey) {
      // Check specific session
      const session = activeSessions.get(streamKey);
      return NextResponse.json({
        success: true,
        streamKey,
        isActive: !!session,
        session: session
          ? {
              startTime: session.startTime,
              chunkCount: session.chunkCount,
              totalSize: session.totalSize,
              duration: Date.now() - session.startTime,
              avgChunkSize: session.totalSize / session.chunkCount,
              lastChunkTime: session.lastChunkTime,
            }
          : null,
        requestId,
      });
    } else {
      // Return all active sessions
      const sessions = Array.from(activeSessions.entries()).map(
        ([key, session]) => ({
          streamKey: key,
          startTime: session.startTime,
          chunkCount: session.chunkCount,
          totalSize: session.totalSize,
          duration: Date.now() - session.startTime,
          avgChunkSize: session.totalSize / session.chunkCount,
          lastChunkTime: session.lastChunkTime,
        })
      );

      return NextResponse.json({
        success: true,
        activeSessions: sessions,
        count: sessions.length,
        requestId,
      });
    }
  } catch (error: unknown) {
    console.error(
      `[Simple-Bridge:${requestId}] Error checking session status:`,
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check session status",
        requestId,
      },
      { status: 500 }
    );
  }
}
