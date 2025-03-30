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

Manages viewer-side Twilio video connections with automatic reconnection handling.

**Usage:**
```tsx
const {
  isConnected,
  isConnecting,
  error,
  reconnectAttempts,
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

### `useStreamerControls`

Manages the streamer's camera and microphone controls with Firestore synchronization.

**Usage:**
```tsx
const {
  isMicEnabled,
  isVideoEnabled,
  toggleMic,
  toggleVideo,
  streamState,
} = useStreamerControls(streamId, localMediaStream);
```

### `useStreamStatusMonitor`

Monitors stream status updates for viewers with real-time updates for camera and mic status.

**Usage:**
```tsx
const {
  streamerStatus,
  hasStarted,
  hasEnded,
  streamDuration,
} = useStreamStatusMonitor(streamId);
```

### `useStreamConnection`

Manages connection to a Twilio room with retry logic and error handling.

**Usage:**
```tsx
const {
  room,
  remoteParticipant,
  connectionState,
  connectionError,
  connect,
  disconnect,
} = useStreamConnection(streamId, userName);
```

### `useMountedRef`

Utility hook that provides a ref indicating if a component is mounted, useful for preventing updates after unmount.

**Usage:**
```tsx
const isMountedRef = useMountedRef();

useEffect(() => {
  fetchData().then(data => {
    if (isMountedRef.current) {
      setState(data);
    }
  });
}, []);
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
- `useStreamerControls.ts` - For managing streamer's camera and mic controls
- `useStreamStatusMonitor.ts` - For monitoring stream status in real-time
- `useStreamConnection.ts` - For managing Twilio room connections
- `useMountedRef.ts` - For component mount state tracking

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
8. **Use Refs for Cleanup Flags**: Consider using refs like `isMountedRef` to prevent state updates after unmount.
9. **Handle Device Changes**: For media hooks, handle device changes (connect/disconnect) gracefully.
10. **Optimize Re-renders**: Memoize return values and callback functions where appropriate.

## Adding New Hooks

When adding new hooks, consider:
1. Is the hook focused on a single responsibility?
2. Can it be reused across multiple components?
3. Is it properly typed and documented?
4. Does it handle cleanup properly?
5. Does it handle error states and loading states?
6. Is it responsive to changes in its dependencies? 