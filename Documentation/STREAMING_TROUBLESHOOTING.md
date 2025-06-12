# Streaming Troubleshooting Guide

This guide helps diagnose and fix common streaming issues in the CelebFitLife application.

## Common Issue: Stream Status "Idle" (412 Precondition Failed)

### Problem
When viewing a live stream, you see errors like:
- `GET https://stream.mux.com/[playback-id].m3u8 412 (Precondition Failed)`
- `This playback-id may belong to a live stream that is not currently active`
- Stream status shows as "idle" instead of "active"

### Root Cause
A Mux live stream has three possible statuses:
- **idle**: Stream is created but not receiving RTMP data
- **active**: Stream is receiving RTMP data and can be viewed
- **disabled**: Stream is disabled and cannot accept connections

The 412 error occurs when trying to play a stream that's in "idle" status.

### Solutions

#### 1. Enable the Stream
If the stream is disabled, enable it:
```javascript
// Via API
POST /api/mux/streams/enable?streamId=[streamId]

// Via debug controls (development mode)
// Click "Enable Stream" button on the live stream page
```

#### 2. Check RTMP Bridge Status
Verify that the browser streaming is working:
```javascript
// Check if RTMP bridge is receiving data
GET /api/streaming/rtmp-bridge?streamKey=[streamKey]
```

#### 3. Verify Streamer is Broadcasting
The stream will only become "active" when:
- The streamer has started their browser stream
- MediaRecorder is capturing video/audio
- RTMP bridge is converting and sending data to Mux

#### 4. Use Debug Tools (Development Mode)
On the live stream page in development mode, you'll see debug controls:
- **Enable Stream**: Manually enable the Mux stream
- **Check Status**: Get current stream status from Mux
- **Check RTMP**: Verify RTMP bridge is active

### Technical Flow

1. **Stream Creation**: Mux stream created with "idle" status
2. **Stream Enable**: Stream enabled to accept RTMP connections
3. **Browser Streaming**: MediaRecorder captures video/audio
4. **RTMP Bridge**: Converts WebM chunks to RTMP format
5. **Mux Ingestion**: Mux receives RTMP data, status becomes "active"
6. **Playback**: Stream can now be viewed by users

### Debugging Steps

1. **Check Stream Status**:
   ```javascript
   const response = await fetch(`/api/mux/streams?streamId=${streamId}`);
   const result = await response.json();
   console.log('Stream status:', result.liveStream.status);
   ```

2. **Check RTMP Bridge**:
   ```javascript
   const response = await fetch(`/api/streaming/rtmp-bridge?streamKey=${streamKey}`);
   const result = await response.json();
   console.log('RTMP active:', result.isActive);
   ```

3. **Enable Stream if Needed**:
   ```javascript
   const response = await fetch(`/api/mux/streams/enable?streamId=${streamId}`, {
     method: 'POST'
   });
   const result = await response.json();
   console.log('Enable result:', result.success);
   ```

### Prevention

To prevent this issue:
1. Always enable streams after creation
2. Ensure MediaRecorder starts properly
3. Monitor RTMP bridge connectivity
4. Implement proper error handling and retry logic

### Related Files

- `app/streaming/live/[slug]/page.tsx` - Live stream viewer
- `components/streaming/VideoContainer.tsx` - Video player component
- `app/api/mux/streams/enable/route.ts` - Stream enable API
- `app/api/streaming/rtmp-bridge/route.ts` - RTMP bridge
- `lib/helpers/streamDiagnostics.ts` - Diagnostic utilities
- `components/streaming/StreamManager.tsx` - Stream management

### Environment Requirements

For RTMP bridge to work properly:
- FFmpeg must be installed on the server
- RTMP endpoint must be accessible
- Proper environment variables must be set:
  - `MUX_TOKEN_ID`
  - `MUX_TOKEN_SECRET` (or `MUX_ACCESS_TOKEN_ID` and `MUX_SECRET_KEY`) 