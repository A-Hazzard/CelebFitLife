import { NextRequest, NextResponse } from "next/server";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";

export const dynamic = "force-dynamic";

/**
 * RTMP streaming bridge that converts browser WebM chunks to RTMP stream for Mux
 * This uses FFmpeg to convert WebM video chunks to RTMP format
 */

// Store active FFmpeg processes
const activeStreams = new Map<
  string,
  {
    process: ChildProcessWithoutNullStreams;
    streamKey: string;
    startTime: number;
    chunkCount: number;
    totalSize: number;
    lastChunkTime: number;
  }
>();

/**
 * POST handler for receiving video chunks and streaming to RTMP
 */
export async function POST(req: NextRequest) {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 12);

  console.log(`[RTMP-Bridge:${requestId}] Received chunk`);

  try {
    const formData = await req.formData();
    const chunk = formData.get("chunk") as File;
    const streamKey = formData.get("streamKey") as string;
    // const timestamp = formData.get("timestamp") as string; // Not used in current implementation

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

    // Check if we have an active stream for this key
    let streamInfo = activeStreams.get(streamKey);

    if (!streamInfo) {
      // Start new RTMP stream
      console.log(
        `[RTMP-Bridge:${requestId}] Starting new RTMP stream for key: ${streamKey}`
      );

      // Create FFmpeg process optimized for Mux RTMP streaming.
      // We are letting FFmpeg auto-detect the input container format from the
      // piped data, as this is more robust for handling streams from MediaRecorder.
      const ffmpegArgs = [
        // Input settings
        "-i",
        "pipe:0",

        // Video encoding settings optimized for live streaming
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-tune",
        "zerolatency",
        "-profile:v",
        "main",
        "-level",
        "4.0",
        "-pix_fmt",
        "yuv420p",

        // Audio encoding settings
        "-c:a",
        "aac",
        "-ar",
        "44100",
        "-b:a",
        "128k",
        "-ac",
        "2",
        "-strict",
        "experimental",

        // Bitrate and quality settings for Mux
        "-b:v",
        "1500k",
        "-maxrate",
        "1500k",
        "-bufsize",
        "3000k",
        "-g",
        "60",
        "-keyint_min",
        "60",
        "-sc_threshold",
        "0",
        "-force_key_frames",
        "expr:gte(t,n_forced*2)",

        // RTMP output settings optimized for Mux
        "-f",
        "flv",
        "-flvflags",
        "no_duration_filesize",
        "-rtmp_live",
        "live",
        "-rtmp_buffer",
        "1000",

        // Mux RTMP endpoint
        `rtmps://global-live.mux.com:443/live/${streamKey}`,
      ];

      console.log(
        `[RTMP-Bridge:${requestId}] Starting FFmpeg with args:`,
        ffmpegArgs
      );

      const ffmpegProcess = spawn("ffmpeg", ffmpegArgs, {
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Handle FFmpeg output
      ffmpegProcess.stdout.on("data", (data) => {
        console.log(
          `[RTMP-Bridge:${requestId}] FFmpeg stdout:`,
          data.toString()
        );
      });

      ffmpegProcess.stderr.on("data", (data) => {
        const output = data.toString();
        console.log(`[RTMP-Bridge:${requestId}] FFmpeg stderr:`, output);

        // Check for successful RTMP connection
        if (
          output.includes("Stream mapping:") ||
          output.includes("Press [q] to stop")
        ) {
          console.log(
            `[RTMP-Bridge:${requestId}] FFmpeg successfully connected to RTMP`
          );
        }

        // Check for RTMP connection errors
        if (
          output.includes("Connection refused") ||
          output.includes("RTMP_Connect0")
        ) {
          console.error(
            `[RTMP-Bridge:${requestId}] RTMP connection failed:`,
            output
          );
        }
      });

      ffmpegProcess.on("close", (code) => {
        console.log(
          `[RTMP-Bridge:${requestId}] FFmpeg process closed with code:`,
          code
        );
        activeStreams.delete(streamKey);
      });

      ffmpegProcess.on("error", (error) => {
        console.error(
          `[RTMP-Bridge:${requestId}] FFmpeg process error:`,
          error
        );
        activeStreams.delete(streamKey);
      });

      // Store stream info
      streamInfo = {
        process: ffmpegProcess,
        streamKey,
        startTime: Date.now(),
        chunkCount: 0,
        totalSize: 0,
        lastChunkTime: Date.now(),
      };
      activeStreams.set(streamKey, streamInfo);
    }

    // Update stream stats
    streamInfo.chunkCount++;
    streamInfo.totalSize += chunk.size;
    streamInfo.lastChunkTime = Date.now();

    // Convert chunk to buffer and write to FFmpeg stdin
    const arrayBuffer = await chunk.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      if (streamInfo.process.stdin.writable) {
        streamInfo.process.stdin.write(buffer);

        console.log(`[RTMP-Bridge:${requestId}] Sent chunk to FFmpeg:`, {
          streamKey: streamKey.substring(0, 8) + "...",
          chunkSize: buffer.length,
          chunkCount: streamInfo.chunkCount,
          totalSize: streamInfo.totalSize,
          mimeType: chunk.type,
          sessionDuration: Date.now() - streamInfo.startTime,
        });
      } else {
        throw new Error("FFmpeg stdin is not writable");
      }
    } catch (writeError) {
      console.error(
        `[RTMP-Bridge:${requestId}] Error writing to FFmpeg:`,
        writeError
      );

      // Clean up failed stream
      activeStreams.delete(streamKey);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to write to FFmpeg process",
          requestId,
        },
        { status: 500 }
      );
    }

    const requestDuration = Date.now() - requestStartTime;

    return NextResponse.json({
      success: true,
      requestId,
      latency: requestDuration,
      chunkSize: buffer.length,
      chunkCount: streamInfo.chunkCount,
      totalSize: streamInfo.totalSize,
      sessionDuration: Date.now() - streamInfo.startTime,
      message: `Chunk ${streamInfo.chunkCount} sent to RTMP (${(
        buffer.length / 1024
      ).toFixed(1)}KB)`,
    });
  } catch (error: unknown) {
    const requestDuration = Date.now() - requestStartTime;
    console.error(
      `[RTMP-Bridge:${requestId}] Error processing chunk after ${requestDuration}ms:`,
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
 * DELETE handler for stopping RTMP streams
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

    const streamInfo = activeStreams.get(streamKey);
    if (streamInfo) {
      console.log(
        `[RTMP-Bridge:${requestId}] Stopping RTMP stream for key: ${streamKey}`
      );

      // Close FFmpeg stdin to signal end of stream
      if (streamInfo.process.stdin.writable) {
        streamInfo.process.stdin.end();
      }

      // Kill the process after a short delay
      setTimeout(() => {
        if (!streamInfo.process.killed) {
          streamInfo.process.kill("SIGTERM");
        }
      }, 2000);

      const sessionStats = {
        duration: Date.now() - streamInfo.startTime,
        totalChunks: streamInfo.chunkCount,
        totalSize: streamInfo.totalSize,
        avgChunkSize: streamInfo.totalSize / streamInfo.chunkCount,
      };

      console.log(
        `[RTMP-Bridge:${requestId}] Stream session stats:`,
        sessionStats
      );
      activeStreams.delete(streamKey);
    }

    return NextResponse.json({
      success: true,
      message: "RTMP stream stopped",
      requestId,
    });
  } catch (error: unknown) {
    console.error(
      `[RTMP-Bridge:${requestId}] Error stopping RTMP stream:`,
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to stop RTMP stream",
        requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for checking RTMP stream status
 */
export async function GET(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 12);

  try {
    const { searchParams } = new URL(req.url);
    const streamKey = searchParams.get("streamKey");

    if (streamKey) {
      // Check specific stream
      const streamInfo = activeStreams.get(streamKey);
      return NextResponse.json({
        success: true,
        streamKey,
        isActive: !!streamInfo,
        stream: streamInfo
          ? {
              startTime: streamInfo.startTime,
              chunkCount: streamInfo.chunkCount,
              totalSize: streamInfo.totalSize,
              duration: Date.now() - streamInfo.startTime,
              avgChunkSize: streamInfo.totalSize / streamInfo.chunkCount,
              lastChunkTime: streamInfo.lastChunkTime,
              processAlive: !streamInfo.process.killed,
            }
          : null,
        requestId,
      });
    } else {
      // Return all active streams
      const streams = Array.from(activeStreams.entries()).map(
        ([key, streamInfo]) => ({
          streamKey: key,
          startTime: streamInfo.startTime,
          chunkCount: streamInfo.chunkCount,
          totalSize: streamInfo.totalSize,
          duration: Date.now() - streamInfo.startTime,
          avgChunkSize: streamInfo.totalSize / streamInfo.chunkCount,
          lastChunkTime: streamInfo.lastChunkTime,
          processAlive: !streamInfo.process.killed,
        })
      );

      return NextResponse.json({
        success: true,
        activeStreams: streams,
        count: streams.length,
        requestId,
      });
    }
  } catch (error: unknown) {
    console.error(
      `[RTMP-Bridge:${requestId}] Error checking RTMP stream status:`,
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check RTMP stream status",
        requestId,
      },
      { status: 500 }
    );
  }
}
