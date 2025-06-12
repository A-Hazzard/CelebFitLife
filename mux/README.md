# Mux Server

This is a dedicated Express server for handling all Mux video streaming operations.

## Setup

1. Install dependencies:
```bash
cd mux
pnpm install
```

2. Copy the environment variables:
```bash
cp .env.example .env
```

3. Add your Mux API credentials to `.env`:
```
MUX_ACCESS_TOKEN_ID=your_mux_access_token_id
MUX_SECRET_KEY=your_mux_secret_key
```

## Development

Run the server in development mode:
```bash
pnpm dev
```

The server will start on port 4000 by default (configurable via `MUX_SERVER_PORT`).

## Production

Build and run the server:
```bash
pnpm build
pnpm start
```

## API Endpoints

- `POST /api/streams` - Create a new live stream
- `GET /api/streams` - Get all assets/recordings
- `GET /api/streams?streamId=xxx` - Get specific stream details
- `POST /api/streams/:streamId/enable` - Enable a live stream
- `POST /api/streams/:streamId/disable` - Disable a live stream
- `DELETE /api/streams/:streamId` - Delete a live stream
- `GET /health` - Health check endpoint

## Environment Variables

- `MUX_ACCESS_TOKEN_ID` - Your Mux access token ID
- `MUX_SECRET_KEY` - Your Mux secret key
- `MUX_SERVER_PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins

## CORS Configuration

The server is configured to accept requests from origins specified in `ALLOWED_ORIGINS`. By default, it allows `http://localhost:3000` for local development.