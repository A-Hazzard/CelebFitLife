import { Router, Request, Response, NextFunction } from 'express';
import { MuxService } from '../services/MuxService';
import { ValidationError } from '../utils/errors';

const router: Router = Router();

/**
 * POST /streams - Create a new live stream
 */
router.post('/', async (req: Request, res: Response, _next: NextFunction) => {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 12);

  console.log(`[API:${requestId}] Create Mux Live Stream API called`);

  try {
    const { playbackPolicy = "public", recordingEnabled = true } = req.body;

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

    res.json({
      success: true,
      liveStream,
      requestId,
      latency: requestDuration,
    });
  } catch (error) {
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

    res.status(status).json({
      success: false,
      error: errorMessage,
      requestId,
      latency: requestDuration,
    });
  }
});

/**
 * GET /streams - Get live streams or assets
 * GET /streams?streamId=xxx - Get specific stream
 */
router.get('/', async (req: Request, res: Response, _next: NextFunction) => {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 12);

  console.log(`[API:${requestId}] Get Live Streams API called`);

  try {
    const streamId = req.query.streamId as string;
    const muxService = new MuxService();

    if (streamId) {
      // Get specific stream
      const liveStream = await muxService.getLiveStream(streamId);

      if (!liveStream) {
        res.status(404).json({
          success: false,
          error: "Live stream not found",
          requestId,
        });
        return;
      }

      res.json({
        success: true,
        liveStream,
        requestId,
        latency: Date.now() - requestStartTime,
      });
    } else {
      // Get assets/recordings
      const assets = await muxService.getAssets();

      res.json({
        success: true,
        assets,
        requestId,
        latency: Date.now() - requestStartTime,
      });
    }
  } catch (error) {
    const requestDuration = Date.now() - requestStartTime;
    console.error(
      `[API:${requestId}] Error retrieving data after ${requestDuration}ms:`,
      error
    );

    res.status(500).json({
      success: false,
      error: "Failed to retrieve live stream data",
      requestId,
      latency: requestDuration,
    });
  }
});

/**
 * POST /streams/:streamId/enable - Enable a live stream
 */
router.post('/:streamId/enable', async (req: Request, res: Response) => {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 12);
  const { streamId } = req.params;

  console.log(`[API:${requestId}] Enable Live Stream API called for stream: ${streamId}`);

  try {
    const muxService = new MuxService();
    const success = await muxService.enableLiveStream(streamId);

    if (!success) {
      res.status(500).json({
        success: false,
        error: "Failed to enable live stream",
        requestId,
        latency: Date.now() - requestStartTime,
      });
      return;
    }

    res.json({
      success: true,
      message: "Live stream enabled successfully",
      requestId,
      latency: Date.now() - requestStartTime,
    });
  } catch (error) {
    const requestDuration = Date.now() - requestStartTime;
    console.error(
      `[API:${requestId}] Error enabling live stream after ${requestDuration}ms:`,
      error
    );

    res.status(500).json({
      success: false,
      error: "Failed to enable live stream",
      requestId,
      latency: requestDuration,
    });
  }
});

/**
 * POST /streams/:streamId/disable - Disable a live stream
 */
router.post('/:streamId/disable', async (req: Request, res: Response) => {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 12);
  const { streamId } = req.params;

  console.log(`[API:${requestId}] Disable Live Stream API called for stream: ${streamId}`);

  try {
    const muxService = new MuxService();
    const success = await muxService.disableLiveStream(streamId);

    if (!success) {
      res.status(500).json({
        success: false,
        error: "Failed to disable live stream",
        requestId,
        latency: Date.now() - requestStartTime,
      });
      return;
    }

    res.json({
      success: true,
      message: "Live stream disabled successfully",
      requestId,
      latency: Date.now() - requestStartTime,
    });
  } catch (error) {
    const requestDuration = Date.now() - requestStartTime;
    console.error(
      `[API:${requestId}] Error disabling live stream after ${requestDuration}ms:`,
      error
    );

    res.status(500).json({
      success: false,
      error: "Failed to disable live stream",
      requestId,
      latency: requestDuration,
    });
  }
});

/**
 * DELETE /streams/:streamId - Delete a live stream
 */
router.delete('/:streamId', async (req: Request, res: Response) => {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 12);
  const { streamId } = req.params;

  console.log(`[API:${requestId}] Delete Live Stream API called for stream: ${streamId}`);

  try {
    const muxService = new MuxService();
    const success = await muxService.deleteLiveStream(streamId);

    if (!success) {
      res.status(500).json({
        success: false,
        error: "Failed to delete live stream",
        requestId,
        latency: Date.now() - requestStartTime,
      });
      return;
    }

    res.json({
      success: true,
      message: "Live stream deleted successfully",
      requestId,
      latency: Date.now() - requestStartTime,
    });
  } catch (error) {
    const requestDuration = Date.now() - requestStartTime;
    console.error(
      `[API:${requestId}] Error deleting live stream after ${requestDuration}ms:`,
      error
    );

    res.status(500).json({
      success: false,
      error: "Failed to delete live stream",
      requestId,
      latency: requestDuration,
    });
  }
});

export default router;