# CelebFitLife Utility Functions

This directory contains utility functions used throughout the CelebFitLife application. These utilities provide common functionality for media handling, authentication, and streaming operations.

## Available Utilities

### Streaming Utilities (`streaming.ts`)

#### `setupReconnectionHandlers`
Sets up event handlers for Twilio room reconnection events.
```typescript
setupReconnectionHandlers(
  room, 
  onReconnecting, 
  onReconnected, 
  onReconnectionFailed
);
```

#### `handleAutoReconnect`
Attempts to reconnect to a Twilio room with exponential backoff.
```typescript
await handleAutoReconnect(
  slug, 
  userName, 
  createRoom,
  maxAttempts, 
  onAttempt, 
  onSuccess, 
  onFailure
);
```

#### `handleMediaTrackErrors`
Handles errors related to media tracks to provide user-friendly error messages.
```typescript
const errorMessage = handleMediaTrackErrors(error);
```

#### `setupLocalMediaTracks`
Creates and configures local media tracks based on device settings and preferences.
```typescript
const { videoTrack, audioTrack } = await setupLocalMediaTracks(
  cameraId, 
  micId, 
  { isVideoEnabled, isAudioEnabled }
);
```

#### `formatDuration`
Formats a duration in seconds to a human-readable string (HH:MM:SS).
```typescript
const formattedTime = formatDuration(durationInSeconds);
```

### Media Utilities (`media.ts`)

#### `DEFAULT_STREAM_THUMBNAIL`
A constant holding the default thumbnail URL for streams.

#### `CATEGORY_THUMBNAILS`
An object mapping fitness categories to their respective thumbnail URLs.

#### `getStreamThumbnail`
Determines the best available thumbnail URL based on provided inputs.
```typescript
const thumbnailUrl = getStreamThumbnail(customThumbnailUrl, category, title);
```

#### `isValidUrl`
Checks if a given string is a properly formatted URL.
```typescript
if (isValidUrl(thumbnailUrl)) {
  // Use the URL
}
```

#### `generateVideoThumbnail`
Generates a thumbnail from the first frame of a video element.
```typescript
const thumbnailDataUrl = await generateVideoThumbnail(
  videoElement, 
  'image/jpeg', 
  0.8
);
```

#### `detectMediaDeviceChanges`
Monitors changes in media devices (camera/microphone connect/disconnect) and provides callbacks.
```typescript
const stopDetecting = detectMediaDeviceChanges(
  onDevicesChanged,
  onDevicesError
);
```

#### `getDevicePermissionStatus`
Checks if the user has granted camera and microphone permissions.
```typescript
const { camera, microphone } = await getDevicePermissionStatus();
```

### Authentication Utilities (`auth.ts`)

#### `getCurrentUser`
Gets the current user from Firebase Authentication.
```typescript
const user = getCurrentUser();
```

#### `formatUserName`
Formats a user's display name for consistent presentation.
```typescript
const formattedName = formatUserName(user.displayName);
```

### Error Handling Utilities (`errors.ts`)

#### `parseFirebaseError`
Parses Firebase error codes into user-friendly messages.
```typescript
const errorMessage = parseFirebaseError(error);
```

#### `parseTwilioError`
Converts Twilio error codes into actionable error messages.
```typescript
const { message, isRecoverable } = parseTwilioError(error);
```

#### `handleNetworkErrors`
Handles network-related errors with appropriate retry strategies.
```typescript
const { shouldRetry, retryAfter, message } = handleNetworkErrors(error);
```

## File Structure

- `streaming.ts` - Utilities for Twilio and streaming functionality
- `media.ts` - Utilities for media operations like thumbnails
- `auth.ts` - Authentication-related utilities
- `errors.ts` - Error handling and parsing utilities
- `formatting.ts` - Text and data formatting utilities
- `validation.ts` - Form and data validation utilities

## Best Practices

1. **Keep utilities pure**: Utilities should be pure functions when possible.
2. **TypeScript typing**: Use proper TypeScript types for parameters and return values.
3. **Error handling**: Include appropriate error handling.
4. **Documentation**: Document all utilities with JSDoc comments.
5. **Testing**: Write unit tests for utilities when possible.
6. **Performance**: Consider memoization for expensive operations.
7. **Browser Compatibility**: Ensure utilities work across all supported browsers.
8. **Avoid Side Effects**: Utilities should generally avoid side effects, with clear documentation when they do have them.

## Adding New Utilities

When adding new utilities, consider:
1. Is the utility general enough to be reused across the application?
2. Does it fit into an existing utility file, or should it be in a new file?
3. Is it properly typed and documented?
4. Does it follow functional programming principles where appropriate?
5. Is it thoroughly tested with edge cases?
6. Does it handle errors gracefully?

**Note:** Firebase-related utilities (Admin SDK helpers) have been consolidated into `/lib/firebase/admin.ts`. 