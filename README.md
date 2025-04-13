# CelebFitLife

CelebFitLife is a live streaming platform that connects fitness influencers with fans through interactive workout sessions and training content.

## Features

- **Live Streaming**: Broadcast high-quality workouts in real-time
- **Interactive Chat**: Engage with viewers during live sessions
- **Stream Scheduling**: Plan and promote upcoming sessions
- **Stream Management**: Control camera, microphone, and stream settings
- **Video Playback**: Watch recorded workout sessions
- **Responsive Design**: Optimized for desktop and mobile devices
- **Realtime Status Sync**: Camera and microphone status sync between streamer and viewers
- **Session Recovery**: Automatic handling of temporary connection issues
- **Robust Error Handling**: Comprehensive error management for Twilio connections
- **Automatic Reconnection**: Recovery from network glitches and disconnections

## Tech Stack

- **Frontend**: Next.js 13+ with App Router, React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Real-time Communication**: Twilio Video and Chat APIs
- **State Management**: React Context API, Zustand, and custom hooks
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Vercel

## Project Structure

*   `/app`: Next.js 13 App Router structure.
    *   `/(auth)`: Authentication routes (login, register).
    *   `/dashboard`: User dashboard routes.
    *   `/streaming`: Live streaming view routes.
    *   `/api`: API routes including Twilio integration.
    *   `/feeds`: Content feed pages.
    *   `/profile`: User profile pages.
    *   `/features`: Feature showcase pages.
*   `/components`: Reusable UI components.
    *   `/streaming`: Live streaming components.
    *   `/ui`: Shadcn UI components.
    *   `/dashboard`: Dashboard-specific components.
*   `/lib`: Core logic, utilities, types, hooks, and configurations.
    *   `/config`: Non-Firebase configurations (e.g., Twilio).
    *   `/firebase`: Firebase client and admin SDK setup.
    *   `/helpers`: Helper functions for specific features.
    *   `/hooks`: Custom React hooks.
    *   `/models`: Data models/types.
    *   `/services`: Service classes for external APIs.
    *   `/store`: Zustand state management.
    *   `/types`: TypeScript type definitions.
    *   `/utils`: General utility functions.
    *   `/data`: Static data and constants.
*   `/public`: Static assets.

```
├── app/                      # Next.js app router
│   ├── (auth)/               # Authentication-specific pages with route group
│   ├── api/                  # Server-side API routes
│   │   ├── auth/             # Authentication-related endpoints
│   │   ├── twilio/           # Twilio token generation and room management
│   │   └── models/           # Data model endpoints
│   ├── dashboard/            # Dashboard pages
│   │   └── streams/          # Stream management
│   │       └── manage/       # Streamer controls for live sessions
│   ├── features/             # Feature showcase pages
│   ├── learn-more/           # Information pages
│   ├── profile/              # User profile management
│   ├── streaming/            # Viewer streaming pages
│   │   └── live/             # Live stream viewing
│   ├── feeds/                # Content feed pages
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout component
│   └── page.tsx              # Home page component
│
├── components/               # Reusable React components
│   ├── dashboard/            # Dashboard-specific components
│   ├── layout/               # Layout components (header, footer, etc.)
│   ├── payment/              # Payment-related components
│   ├── profile/              # Profile management components
│   ├── streaming/            # Streaming-specific components
│   │   ├── StreamManager.tsx # Streamer camera/mic controls
│   │   ├── StreamChat.tsx    # Chat functionality
│   │   ├── DeviceTester.tsx  # Device selection interface
│   │   └── Countdown.tsx     # Scheduled stream countdown
│   └── ui/                   # UI components (from shadcn/ui)
│
├── lib/                      # Shared utilities and helpers
│   ├── config/               # Configuration files (Firebase, etc.)
│   ├── helpers/              # Business logic helpers
│   │   ├── streaming.ts      # Stream management helpers
│   │   ├── devices.ts        # Device management helpers
│   │   └── auth.ts           # Authentication helpers
│   ├── hooks/                # Custom React hooks
│   │   ├── useStreamData.ts  # Firestore stream data management
│   │   ├── useMediaDevices.ts# Device selection management
│   │   └── useTwilioViewerConnection.ts # Viewer connection management
│   ├── services/             # External service integrations
│   │   ├── ClientTwilioService.ts # Client-side Twilio service
│   ├── store/                # State management
│   │   ├── useAuthStore.ts   # Authentication state
│   ├── types/                # TypeScript type definitions
│   │   ├── streaming.ts      # Stream data types
│   │   ├── streaming-components.ts # Component prop types
│   │   ├── streaming-hooks.ts # Hook result types
│   │   └── twilio.ts         # Twilio-specific types
│   ├── utils/                # Utility functions
│   │   ├── twilio.ts         # Twilio connection helpers
│   └── data/                 # Static data and constants
│
├── public/                   # Static assets
```

## Key Interfaces and Types

The application uses TypeScript interfaces to ensure type safety across components:

### Streaming Types (`lib/types/streaming.ts`)
- **Stream**: Core stream data structure with status fields
- **StreamStatus**: Enum of possible stream statuses
- **StreamError**: Error structure for streaming issues
- **StreamEvent**: Events that can occur during streaming

### Component Types (`lib/types/streaming-components.ts`)
- **StreamManagerProps**: Props for the StreamManager component
- **StreamChatProps**: Props for the chat component
- **CountdownProps**: Props for scheduled stream countdown

### Hook Result Types (`lib/types/streaming-hooks.ts`)
- **StreamChatHookResult**: Return type for useStreamChat hook
- **UseStreamDataResult**: Return type for useStreamData hook

## Error Handling

The application implements robust error handling, particularly for Twilio connections:

### Twilio Error Codes
- **20101**: Invalid Access Token
- **20103**: Invalid Token Issuer/Subject
- **20104**: Token Expired
- **53000**: Room Not Found
- **53205**: Room Full

### Recovery Mechanisms
- **Automatic Reconnection**: After network disruptions
- **Connection Retries**: Up to 5 attempts with exponential backoff
- **Error State Recovery**: Automatic recovery after 30 seconds
- **Track Resubscription**: For lost video/audio tracks
- **Health Monitoring**: 5-second interval checks for media tracks

## Helper Functions

The application includes several helper functions in `lib/helpers/`:

### Streaming Helpers
- **createStream**: Creates a stream document in Firestore
- **fetchStreamInfo**: Gets stream data by slug
- **prepareStreamStart**: Prepares a stream to start and gets a Twilio token
- **endStream**: Properly ends a stream and updates Firestore
- **updateStreamDeviceStatus**: Updates audio/video device status

### Device Management
- **saveDevicePreferences**: Saves user device choices
- **testMediaDevices**: Tests if selected devices are working

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn/pnpm
- Firebase account
- Twilio account (with Video API)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/celebfitlife.git
   cd celebfitlife
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   
   # Twilio
   TWILIO_ACCOUNT_SID=
   TWILIO_API_KEY_SID=
   TWILIO_API_KEY_SECRET=
   ```

4. Start the development server:
   ```
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Troubleshooting Common Issues

### Viewer Connection Problems
- **Stuck on "Waiting"**: Ensure the stream has actually started (hasStarted=true in Firestore)
- **Connection Error**: Check browser console for specific error codes
- **Black Screen**: Ensure the streamer has enabled their camera

### Streamer Broadcasting Issues
- **Failed to Start Stream**: Check device permissions and Twilio credentials
- **Disconnections**: Could indicate network issues, check internet connection
- **Audio/Video Not Showing**: Ensure correct device is selected in settings

### Browser Compatibility
- **Best experience**: Chrome, Edge, or Firefox (latest versions)
- **Safari limitations**: Some media features may have limited support
- **Mobile support**: Works on modern mobile browsers with camera/mic access

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Twilio for their excellent video and chat APIs
- Firebase for their real-time database and authentication services
- shadcn/ui for the beautiful component library
