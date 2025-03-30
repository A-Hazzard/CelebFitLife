# CelebFitLife Helper Functions

This directory contains helper functions used throughout the CelebFitLife application. These helpers handle Firebase interactions, Twilio setup, and other business logic operations.

## Available Helpers

### Streaming Helpers (`streaming.ts`)

#### `createStream`
Creates a new stream document in Firestore.
```typescript
const result = await createStream(
  userId,
  title,
  description,
  thumbnailUrl,
  scheduledAt
);
```

#### `createStreamProfile`
Handles the submission of a stream profile (placeholder for future implementation).
```typescript
const result = await createStreamProfile(streamProfile);
```

#### `fetchStreamInfo`
Fetches stream information from Firestore based on slug.
```typescript
const { success, data, error } = await fetchStreamInfo(slug);
```

#### `updateStreamInfo`
Updates a stream's title and thumbnail URL in Firestore.
```typescript
const result = await updateStreamInfo(slug, title, thumbnailUrl);
```

#### `prepareStreamStart`
Prepares a stream to start by updating its status in Firestore and fetching a Twilio token.
```typescript
const { success, token, error } = await prepareStreamStart(
  slug,
  userId,
  userName
);
```

#### `endStream`
Ends a stream by updating its status in Firestore and disconnecting the Twilio room.
```typescript
const result = await endStream(slug, room);
```

#### `updateStreamDeviceStatus`
Updates the audio/video status or device IDs of a stream document in Firestore.
```typescript
const result = await updateStreamDeviceStatus(slug, {
  audioMuted: true,
  cameraOff: false,
  currentCameraId: "camera-1",
  currentMicId: "mic-1"
});
```

#### `setupTwilioRoom`
Sets up a Twilio room connection with audio and video tracks.
```typescript
const result = await setupTwilioRoom(
  slug,
  userName,
  currentCameraId,
  currentMicId,
  videoContainerRef,
  { audioMuted: false, cameraOff: false }
);
```

#### `handleStreamStatusChange`
Handles changes to stream status (started, ended, camera/mic toggled) and updates Firestore.
```typescript
const result = await handleStreamStatusChange(slug, {
  hasStarted: true,
  audioMuted: false,
  cameraOff: false
});
```

#### `fetchTwilioToken`
Retrieves a Twilio access token for connecting to a room.
```typescript
const { success, token, error } = await fetchTwilioToken(slug, identity);
```

#### `reconnectToStream`
Attempts to reconnect to a stream after disconnection with retry logic.
```typescript
const result = await reconnectToStream(
  slug, 
  userName, 
  maxAttempts, 
  delayMs
);
```

### Media Device Helpers (`devices.ts`)

#### `saveDevicePreferences`
Saves user device preferences to local storage and optionally to Firestore.
```typescript
const result = await saveDevicePreferences({
  cameraId,
  microphoneId,
  speakerId,
  videoQuality
}, userId);
```

#### `loadDevicePreferences`
Loads saved device preferences from local storage or Firestore.
```typescript
const { 
  cameraId, 
  microphoneId, 
  speakerId,
  videoQuality
} = await loadDevicePreferences(userId);
```

#### `testMediaDevices`
Tests if selected media devices are working properly.
```typescript
const { camera, microphone, success, error } = await testMediaDevices(
  cameraId,
  microphoneId
);
```

## File Structure

- `streaming.ts` - Functions for stream creation, management, and Twilio setup
- `devices.ts` - Media device management and testing
- `auth.ts` - Authentication-related helpers
- `analytics.ts` - Analytics tracking helpers
- `payment.ts` - Payment processing helpers

## Best Practices

1. **Error handling**: All helpers should include proper error handling with consistent error response structures.
2. **TypeScript typing**: Use proper TypeScript types for parameters and return values.
3. **Function documentation**: Document all functions with JSDoc comments.
4. **Keep functions pure**: When possible, make functions pure and focused on a single responsibility.
5. **Consistent return values**: Maintain a consistent pattern for return values (e.g., using `{ success, error }` objects).
6. **Logging**: Include appropriate logging for debugging and monitoring.
7. **Parameter validation**: Validate input parameters to prevent errors.
8. **Handle edge cases**: Ensure helpers handle edge cases gracefully.
9. **Use async/await**: Prefer async/await for asynchronous operations over Promises.

## Adding New Helpers

When adding new helpers, consider:
1. Is the helper focused on a specific domain (e.g., streams, auth, payments)?
2. Should it be grouped with existing helpers or placed in a new file?
3. Is it properly typed and documented?
4. Does it follow the error handling pattern used in existing helpers?
5. Does it include proper logging for debugging?
6. Is it thoroughly tested with edge cases? 