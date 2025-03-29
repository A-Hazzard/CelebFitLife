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

## File Structure

- `streaming.ts` - Utilities for Twilio and streaming functionality
- `media.ts` - Utilities for media operations like thumbnails
- `auth.ts` - Authentication-related utilities

## Best Practices

1. **Keep utilities pure**: Utilities should be pure functions when possible.
2. **TypeScript typing**: Use proper TypeScript types for parameters and return values.
3. **Error handling**: Include appropriate error handling.
4. **Documentation**: Document all utilities with JSDoc comments.
5. **Testing**: Write unit tests for utilities when possible.

## Adding New Utilities

When adding new utilities, consider:
1. Is the utility general enough to be reused across the application?
2. Does it fit into an existing utility file, or should it be in a new file?
3. Is it properly typed and documented?
4. Does it follow functional programming principles where appropriate? 