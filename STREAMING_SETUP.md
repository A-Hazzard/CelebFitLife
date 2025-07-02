# CelebFitLife Streaming Setup Guide

This guide will help you set up the new dual-server architecture for live streaming functionality.

## Architecture Overview

The streaming functionality has been separated into two servers:

1. **Next.js App (Port 3000)** - Main application UI and API routes
2. **Streaming Server (Port 3001)** - Dedicated WebSocket and RTMP forwarding

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   Next.js App   │    │ Streaming Server│
│   (Port 3000)   │◄──►│   (Port 3000)   │◄──►│   (Port 3001)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         │              WebSocket Connection            │
         └──────────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │     Mux API     │
                    │   (RTMP/HLS)    │
                    └─────────────────┘
```

## Quick Setup

### 1. Install Streaming Server Dependencies

```bash
# Install dependencies for the streaming server
npm run streaming:install
```

### 2. Configure Environment Variables

#### Main App (.env.local)
Your existing environment variables remain the same.

#### Streaming Server (streaming-server/.env)
```bash
cd streaming-server
cp .env.example .env
```

Edit `streaming-server/.env`:
```env
PORT=3001
MUX_TOKEN_ID=your_mux_token_id_here
MUX_TOKEN_SECRET=your_mux_token_secret_here
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
CORS_ORIGIN=http://localhost:3000
```

### 3. Start Both Servers

#### Option A: Start Both Servers Together (Recommended)
```bash
npm run dev:full
```

This will start both the Next.js app (port 3000) and the streaming server (port 3001) with colored logs.

#### Option B: Start Servers Separately

Terminal 1 - Next.js App:
```bash
npm run dev
```

Terminal 2 - Streaming Server:
```bash
npm run streaming:dev
```

## Verification

### 1. Check Server Status

- **Next.js App**: http://localhost:3000
- **Streaming Server Health**: http://localhost:3001/health

### 2. Test WebSocket Connection

The WebSocket connection should now work correctly:
- Client connects to: `ws://localhost:3001/websocket`
- No more "Connection refused" errors

### 3. Verify Streaming Functionality

1. Go to a stream management page
2. Check that device permissions work
3. Verify WebSocket connection establishes
4. Test stream start/stop functionality

## What Changed

### Moved to Streaming Server
- ✅ WebSocket server (`app/api/stream/websocket/route.ts` → `streaming-server/server.js`)
- ✅ RTMP forwarding service (`lib/services/rtmpForwardingService.ts` → `streaming-server/services/rtmpForwardingService.js`)
- ✅ FFmpeg processing and stream management

### Updated in Main App
- ✅ WebSocket connection URL in `useDeviceStore.ts` now points to port 3001
- ✅ Removed old WebSocket route from Next.js
- ✅ Added development scripts for running both servers

### New Features
- 🎯 Dedicated streaming server for better performance
- 📊 Health monitoring endpoints
- 🔄 Improved error handling and reconnection
- 🛡️ Better separation of concerns
- 📝 Comprehensive logging

## Troubleshooting

### Common Issues

1. **Port 3001 already in use**
   ```bash
   # Find and kill process using port 3001
   lsof -ti:3001 | xargs kill -9
   ```

2. **WebSocket connection fails**
   - Ensure streaming server is running on port 3001
   - Check firewall settings
   - Verify CORS configuration

3. **FFmpeg errors**
   - The `ffmpeg-static` package should handle FFmpeg installation
   - On some systems, you may need to install FFmpeg separately

4. **Environment variables not loading**
   - Ensure `.env` file exists in `streaming-server/` directory
   - Check that variables are properly formatted (no spaces around `=`)

### Debug Commands

```bash
# Check if streaming server is running
curl http://localhost:3001/health

# Check active streams
curl http://localhost:3001/streams

# View streaming server logs
npm run streaming:dev

# Test WebSocket connection (using wscat if installed)
npx wscat -c "ws://localhost:3001/websocket?streamId=test&userId=test"
```

## Production Deployment

For production, you'll need to:

1. **Deploy the streaming server separately**
   - Use PM2 or similar process manager
   - Configure environment variables
   - Set up reverse proxy if needed

2. **Update WebSocket URL**
   - Change the hardcoded port 3001 to your production streaming server URL
   - Consider using environment variables for the streaming server URL

3. **Security considerations**
   - Use WSS (secure WebSocket) in production
   - Configure proper CORS origins
   - Implement authentication for WebSocket connections

## Development Tips

- Use `npm run dev:full` for the best development experience
- Monitor both server logs for debugging
- The streaming server includes hot reloading with nodemon
- Health check endpoint provides useful metrics

## Next Steps

1. Test the streaming functionality thoroughly
2. Consider implementing authentication for WebSocket connections
3. Add monitoring and alerting for the streaming server
4. Optimize FFmpeg settings for your use case

---

**Need Help?** Check the logs from both servers and refer to the troubleshooting section above. 