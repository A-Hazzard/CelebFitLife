/**
 * Stream Diagnostics Helper
 *
 * This file contains utilities to diagnose and fix common streaming issues,
 * particularly with Mux live streams that are stuck in 'idle' status.
 */

export type StreamDiagnosticResult = {
  issue: string;
  severity: "info" | "warning" | "error";
  solution: string;
  canAutoFix: boolean;
  autoFixAction?: () => Promise<boolean>;
};

export type StreamHealthCheck = {
  streamId: string;
  playbackId: string;
  streamKey?: string;
  status: "idle" | "active" | "disabled" | "unknown";
  isHealthy: boolean;
  issues: StreamDiagnosticResult[];
  recommendations: string[];
};

/**
 * Perform a comprehensive health check on a Mux live stream
 */
export async function performStreamHealthCheck(
  streamId: string,
  streamKey?: string
): Promise<StreamHealthCheck> {
  const issues: StreamDiagnosticResult[] = [];
  const recommendations: string[] = [];

  try {
    // Check stream status via API
    const streamResponse = await fetch(`/api/mux/streams?streamId=${streamId}`);
    const streamResult = await streamResponse.json();

    if (!streamResult.success) {
      issues.push({
        issue: "Stream not found or API error",
        severity: "error",
        solution: "Check if the stream ID is correct and the stream exists",
        canAutoFix: false,
      });

      return {
        streamId,
        playbackId: "",
        streamKey,
        status: "unknown",
        isHealthy: false,
        issues,
        recommendations: ["Verify stream exists in Mux dashboard"],
      };
    }

    const stream = streamResult.liveStream;
    const status = stream.status as "idle" | "active" | "disabled";

    // Check if stream is idle
    if (status === "idle") {
      issues.push({
        issue: "Stream is in idle status",
        severity: "warning",
        solution: "Stream needs to receive RTMP data to become active",
        canAutoFix: true,
        autoFixAction: async () => {
          try {
            const enableResponse = await fetch(
              `/api/mux/streams/enable?streamId=${streamId}`,
              {
                method: "POST",
              }
            );
            const enableResult = await enableResponse.json();
            return enableResult.success;
          } catch {
            return false;
          }
        },
      });

      recommendations.push("Ensure the streamer has started broadcasting");
      recommendations.push("Check if RTMP bridge is receiving data");
    }

    // Check if stream is disabled
    if (status === "disabled") {
      issues.push({
        issue: "Stream is disabled",
        severity: "error",
        solution: "Enable the stream to accept RTMP connections",
        canAutoFix: true,
        autoFixAction: async () => {
          try {
            const enableResponse = await fetch(
              `/api/mux/streams/enable?streamId=${streamId}`,
              {
                method: "POST",
              }
            );
            const enableResult = await enableResponse.json();
            return enableResult.success;
          } catch {
            return false;
          }
        },
      });
    }

    // Check RTMP bridge status if stream key is available
    if (streamKey) {
      try {
        const rtmpResponse = await fetch(
          `/api/streaming/rtmp-bridge?streamKey=${streamKey}`
        );
        const rtmpResult = await rtmpResponse.json();

        if (!rtmpResult.isActive) {
          issues.push({
            issue: "RTMP bridge is not active",
            severity: "warning",
            solution: "The browser streaming connection is not sending data",
            canAutoFix: false,
          });

          recommendations.push(
            "Check if the streamer has started their browser stream"
          );
          recommendations.push("Verify MediaRecorder is working properly");
        } else {
          recommendations.push("RTMP bridge is active and receiving data");
        }
      } catch (error) {
        console.warn("Failed to check RTMP bridge status:", error);
        issues.push({
          issue: "Cannot check RTMP bridge status",
          severity: "info",
          solution: "RTMP bridge API may be unavailable",
          canAutoFix: false,
        });
      }
    }

    // Determine overall health
    const hasErrors = issues.some((issue) => issue.severity === "error");
    const hasWarnings = issues.some((issue) => issue.severity === "warning");
    const isHealthy = !hasErrors && !hasWarnings;

    if (isHealthy) {
      recommendations.push("Stream appears to be healthy");
    }

    return {
      streamId,
      playbackId: stream.playbackId,
      streamKey,
      status,
      isHealthy,
      issues,
      recommendations,
    };
  } catch (error) {
    console.error("Error performing stream health check:", error);

    return {
      streamId,
      playbackId: "",
      streamKey,
      status: "unknown",
      isHealthy: false,
      issues: [
        {
          issue: "Health check failed",
          severity: "error",
          solution: "Unable to perform health check due to API error",
          canAutoFix: false,
        },
      ],
      recommendations: ["Check network connection and try again"],
    };
  }
}

/**
 * Attempt to automatically fix common stream issues
 */
export async function autoFixStreamIssues(
  healthCheck: StreamHealthCheck
): Promise<{
  success: boolean;
  fixedIssues: string[];
  remainingIssues: string[];
}> {
  const fixedIssues: string[] = [];
  const remainingIssues: string[] = [];

  for (const issue of healthCheck.issues) {
    if (issue.canAutoFix && issue.autoFixAction) {
      try {
        const fixed = await issue.autoFixAction();
        if (fixed) {
          fixedIssues.push(issue.issue);
        } else {
          remainingIssues.push(issue.issue);
        }
      } catch (error) {
        console.error(`Failed to auto-fix issue: ${issue.issue}`, error);
        remainingIssues.push(issue.issue);
      }
    } else {
      remainingIssues.push(issue.issue);
    }
  }

  return {
    success: fixedIssues.length > 0,
    fixedIssues,
    remainingIssues,
  };
}

/**
 * Get user-friendly explanation for stream status
 */
export function getStreamStatusExplanation(status: string): {
  title: string;
  description: string;
  actionRequired: boolean;
} {
  switch (status) {
    case "idle":
      return {
        title: "Stream is Idle",
        description:
          "The stream is created and ready, but not receiving any video data. The streamer needs to start broadcasting.",
        actionRequired: true,
      };

    case "active":
      return {
        title: "Stream is Active",
        description:
          "The stream is live and receiving video data. Viewers can watch the stream.",
        actionRequired: false,
      };

    case "disabled":
      return {
        title: "Stream is Disabled",
        description:
          "The stream has been disabled and cannot accept RTMP connections. It needs to be enabled.",
        actionRequired: true,
      };

    default:
      return {
        title: "Unknown Status",
        description:
          "The stream status is unknown. There may be an issue with the stream or API.",
        actionRequired: true,
      };
  }
}
