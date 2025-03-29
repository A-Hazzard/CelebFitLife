# CelebFitLife Custom Hooks

This directory contains custom React hooks used throughout the CelebFitLife application. These hooks encapsulate complex logic for managing state, side effects, and business operations related to streaming, media, and user interactions.

## Available Hooks

### `useStreamData`

Manages Firestore subscriptions for real-time updates to stream data.

**Usage:**
```tsx
const { 
  streamData, 
  loading, 
  error 
} = useStreamData(slug);

// Access stream properties
if (streamData) {
  console.log(streamData.title, streamData.hasStarted);
}
```

### `useMediaDevices`

Handles media device enumeration and selection for video and audio inputs.

**Usage:**
```tsx
const {
  cameras,
  microphones,
  currentCameraId,
  currentMicId,
  setCurrentCameraId,
  setCurrentMicId,
  refreshDevices,
} = useMediaDevices();
```

### `useTwilioTrackEvents`

Manages Twilio track events with callbacks for video/audio status changes.

**Usage:**
```tsx
useTwilioTrackEvents(
  room,
  {
    onTrackSubscribed,
    onTrackUnsubscribed,
    onTrackDisabled,
    onTrackEnabled,
  }
);
```

### `useNetworkQualityMonitor`

Monitors network quality for Twilio rooms and provides feedback.

**Usage:**
```tsx
const { 
  networkQuality, 
  networkWarning 
} = useNetworkQualityMonitor(room);
```

### `useTwilioViewerConnection`

Manages viewer-side Twilio video connections.

**Usage:**
```tsx
const {
  isConnected,
  isConnecting,
  error,
  disconnect,
} = useTwilioViewerConnection(slug, userName, videoContainerRef);
```

### `useStreamChat`

Manages chat functionality for streams including messages and user actions.

**Usage:**
```tsx
const {
  messages,
  sendMessage,
  isLoading,
  error,
} = useStreamChat(streamId, currentUser);
```

### `useStreamSchedule`

Handles stream scheduling and countdown features.

**Usage:**
```tsx
const {
  countdown,
  status,
  formattedStartTime,
} = useStreamSchedule(scheduledAt, isLive);
```

## File Structure

Each hook should be in its own file, named after the hook:

- `useStreamData.ts` - For managing stream data from Firestore
- `useMediaDevices.ts` - For handling camera and microphone selection
- `useTwilioTrackEvents.ts` - For managing Twilio track subscription events
- `useNetworkQualityMonitor.ts` - For monitoring network quality
- `useTwilioViewerConnection.ts` - For managing viewer connections to streams
- `useStreamChat.ts` - For managing chat functionality
- `useStreamSchedule.ts` - For handling scheduled streams and countdowns

Additionally, we may have index files to organize and export related hooks:

- `index.ts` - Exports all hooks for easy imports
- `streaming/index.ts` - Groups and exports streaming-related hooks

## Best Practices

1. **Single Responsibility**: Each hook should focus on a specific concern.
2. **TypeScript**: Use proper TypeScript types for parameters and return values.
3. **Cleanup**: Include proper cleanup in useEffect to prevent memory leaks.
4. **Dependencies**: Carefully manage effect dependencies to avoid infinite loops.
5. **Documentation**: Document each hook with JSDoc comments explaining its purpose, parameters, and return values.
6. **Error Handling**: Include error handling and loading states where appropriate.
7. **Testing**: Write unit tests for hooks using React Testing Library.

## Adding New Hooks

When adding new hooks, consider:
1. Is the hook focused on a single responsibility?
2. Can it be reused across multiple components?
3. Is it properly typed and documented?
4. Does it handle cleanup properly? 