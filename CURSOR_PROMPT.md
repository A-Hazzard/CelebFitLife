# CelebFitLife Live Streaming Implementation - Fresh Start

## Current Problem Analysis

The current implementation has several issues:
1. **FFmpeg server not starting** - Complex binary data forwarding approach is causing failures
2. **Over-engineered architecture** - Too many moving parts (WebSocket + FFmpeg + RTMP forwarding)
3. **Authentication complexity** - Unnecessary auth layers for basic streaming
4. **UI complexity** - Over-complicated components instead of simple streaming interface

## New Simplified Approach

### Core Architecture (Keep It Simple)
```
Browser → Mux Direct RTMP → Mux HLS Playback
```

**No intermediate servers needed!** Use Mux's direct RTMP ingestion with browser-based streaming via WebRTC to RTMP bridge or simple OBS integration.

## Key Files to Focus On

### Frontend Pages (Functional Programming Only)
- `app/streams/manage/[slug]/page.tsx` - Streamer control page (like Twitch dashboard)
- `app/streaming/live/[slug]/page.tsx` - Viewer page (like Twitch watch page)

### Backend (Express Server with OOP)
- `streaming-server/` - Simple Express server with proper OOP classes
- Focus on Mux API integration only, no FFmpeg complexity

### Reference Files
- `Reference.md` - Complete Mux integration guide
- Mux official documentation for direct RTMP streaming

## Implementation Requirements

### 1. Streaming Server (OOP Architecture)
```javascript
// streaming-server/src/classes/
class MuxStreamManager {
  async createStream(options) { /* Mux API calls */ }
  async getStreamStatus(streamId) { /* Status checks */ }
  async deleteStream(streamId) { /* Cleanup */ }
}

class WebhookHandler {
  handleMuxWebhook(event) { /* Process Mux events */ }
}

class StreamController {
  // Express route handlers
}
```

**Key Points:**
- No FFmpeg, no binary data processing
- Only Mux API calls and webhook handling
- Simple WebSocket for real-time status updates
- Clean OOP separation of concerns

### 2. Frontend Pages (Functional Components)

#### Streamer Page (`/streams/manage/[slug]`)
**Should look like Twitch Creator Dashboard:**
- Stream key display with copy button
- RTMP URL: `rtmps://global-live.mux.com:443/app`
- "Go Live" button (just updates status, user uses OBS)
- Live preview using Mux player (for monitoring)
- Chat simulation area
- Stream stats (viewers, duration, etc.)
- Simple device testing (camera/mic check)

#### Viewer Page (`/streaming/live/[slug]`)
**Should look like Twitch watch page:**
- Large video player (Mux player component)
- Stream title and streamer info
- Live viewer count
- Chat simulation area
- Stream offline message when not live
- Related streams sidebar

### 3. Core Technologies

**Frontend:**
- Next.js 15 App Router
- Functional React components only
- Mux Player React component
- Tailwind CSS for Twitch-like styling
- No authentication required
- Simple state management (useState/useEffect)

**Backend:**
- Express.js with OOP classes
- Mux Node SDK for API calls
- WebSocket for real-time updates
- No FFmpeg, no binary processing
- Simple webhook handling

### 4. Mux Integration (Simplified)

**Stream Creation Flow:**
1. User creates stream → Mux API creates live stream
2. Get stream key and playback ID
3. User copies stream key to OBS
4. User starts streaming in OBS
5. Mux webhooks notify of stream status
6. Frontend updates in real-time

**No Browser Streaming Complexity:**
- Users use OBS or similar software
- Direct RTMP to Mux servers
- No intermediate processing needed

### 5. File Structure
```
streaming-server/
├── src/
│   ├── classes/
│   │   ├── MuxStreamManager.js
│   │   ├── WebhookHandler.js
│   │   └── StreamController.js
│   ├── routes/
│   │   ├── streams.js
│   │   └── webhooks.js
│   └── server.js
├── package.json
└── .env.example

app/
├── streams/manage/[slug]/page.tsx
├── streaming/live/[slug]/page.tsx
└── api/
    └── streams/
        └── route.ts (proxy to streaming-server)
```

### 6. UI Design Requirements

**Twitch-like Design Elements:**
- Dark theme (purple/black color scheme)
- Large video player with 16:9 aspect ratio
- Side panels for chat/info
- Stream status indicators (red dot for live)
- Viewer count with eye icon
- Modern card-based layouts
- Responsive design for mobile

**Key Components Needed:**
- `MuxPlayer` wrapper for video playback
- `StreamStatus` indicator component
- `StreamStats` display component
- `StreamKey` display with copy functionality
- Simple chat simulation UI

### 7. Development Steps

1. **Clean up existing code** - Remove complex FFmpeg server
2. **Create simple Express server** with OOP classes
3. **Implement Mux API integration** (create, get, delete streams)
4. **Add webhook handling** for stream status updates
5. **Build streamer dashboard page** with Twitch-like UI
6. **Build viewer page** with video player
7. **Add real-time updates** via WebSocket
8. **Test with OBS** for actual streaming

### 8. Testing Strategy

**Simple Testing Flow:**
1. Create stream via dashboard
2. Copy stream key to OBS
3. Start streaming in OBS
4. Verify video appears on viewer page
5. Test stop/start functionality
6. Verify webhooks update status correctly

## Key Principles

1. **Simplicity over complexity** - No FFmpeg, no binary processing
2. **Follow Mux best practices** - Use official SDK and documentation
3. **OOP for backend** - Clean class-based architecture
4. **Functional frontend** - Simple React components
5. **Twitch-like UX** - Familiar streaming interface
6. **No authentication** - Focus on core streaming functionality
7. **Real-time updates** - WebSocket for status changes

## Expected Outcome

A working live streaming platform where:
- Streamers can create streams and get RTMP details
- Streamers use OBS to broadcast to Mux
- Viewers can watch live streams via Mux HLS
- Real-time status updates work correctly
- UI looks professional like Twitch
- No complex server-side video processing

This approach eliminates the FFmpeg complexity while providing a robust streaming solution using Mux's infrastructure. 