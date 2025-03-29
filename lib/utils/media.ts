/**
 * Utilities for handling media operations like thumbnails, images, and video processing.
 */

/**
 * Default thumbnail URL to use when no custom thumbnail is provided
 */
export const DEFAULT_STREAM_THUMBNAIL =
  "https://1.bp.blogspot.com/-Rsu_fHvj-IA/YH0ohFqGK_I/AAAAAAAAm7o/dOKXFVif7hYDymAsCNZRe4MK3p7ihTGmgCLcBGAsYHQ/s2362/Stream.jpg";

/**
 * Collection of placeholder thumbnails for different workout/fitness categories
 */
export const CATEGORY_THUMBNAILS: Record<string, string> = {
  Yoga: "https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
  HIIT: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1174&q=80",
  Strength:
    "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
  Pilates:
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
  Cardio:
    "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  Dance:
    "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  Meditation:
    "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
};

/**
 * Gets a thumbnail URL based on stream category, title, or provided URL.
 * Falls back to default if no suitable option is found.
 *
 * @param thumbnailUrl - Custom thumbnail URL provided by the user
 * @param category - Stream category
 * @param title - Stream title
 * @returns The best available thumbnail URL
 */
export const getStreamThumbnail = (
  thumbnailUrl?: string | null,
  category?: string | null,
  title?: string | null
): string => {
  // If a custom thumbnail URL is provided and valid, use it
  if (thumbnailUrl && isValidUrl(thumbnailUrl)) {
    return thumbnailUrl;
  }

  // If a category is provided and we have a preset thumbnail for it, use that
  if (category && CATEGORY_THUMBNAILS[category]) {
    return CATEGORY_THUMBNAILS[category];
  }

  // Check if the title contains any category keywords
  if (title) {
    const lowerTitle = title.toLowerCase();
    for (const [category, url] of Object.entries(CATEGORY_THUMBNAILS)) {
      if (lowerTitle.includes(category.toLowerCase())) {
        return url;
      }
    }
  }

  // Fall back to default thumbnail
  return DEFAULT_STREAM_THUMBNAIL;
};

/**
 * Validates if a string is a properly formatted URL
 *
 * @param url - The URL string to validate
 * @returns True if the URL is valid, false otherwise
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Generates video thumbnail from the first frame of a video element
 *
 * @param videoElement - HTML Video Element to generate thumbnail from
 * @param format - Image format ('image/jpeg' or 'image/png')
 * @param quality - Image quality (0 to 1) for JPEG format
 * @returns Promise resolving to the data URL of the thumbnail
 */
export const generateVideoThumbnail = (
  videoElement: HTMLVideoElement,
  format: "image/jpeg" | "image/png" = "image/jpeg",
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a canvas element with the video dimensions
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // Draw the current video frame to the canvas
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL(format, quality);
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
};
