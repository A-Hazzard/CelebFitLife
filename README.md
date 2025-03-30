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

## Tech Stack

- **Frontend**: Next.js 13+ with App Router, React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Real-time Communication**: Twilio Video and Chat APIs
- **State Management**: React Context API and custom hooks
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Vercel

## Project Structure

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
│   │   └── useStreamSchedule.ts # Stream scheduling functionality
│   ├── models/               # Data models and type definitions
│   ├── services/             # External service integrations
│   ├── store/                # State management
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   │   ├── streaming.ts      # Twilio connection helpers
│   │   ├── media.ts          # Media handling utilities
│   │   └── errors.ts         # Error handling utilities
│   ├── session.ts            # Session management
│   ├── twilio.ts             # Twilio configuration
│   ├── twilioTrackUtils.ts   # Twilio track utilities
│   └── uiConstants.ts        # UI-related constants
│
├── public/                   # Static assets
└── types/                    # Global TypeScript type definitions
```

## API Routes

The application includes several API routes for server-side functionality:

### Authentication APIs (`/app/api/auth/`)
- **`/login`**: Handles user login and session creation
- **`/logout`**: Handles user logout and session destruction
- **`/register`**: Handles new user registration

### Twilio APIs (`/app/api/twilio/`)
- **`/token`**: Generates Twilio access tokens for video rooms
- **`/rooms`**: Manages Twilio room creation and configuration

### Data Model APIs (`/app/api/models/`)
- **`/streams`**: CRUD operations for stream management
- **`/users`**: User profile management

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Firebase account
- Twilio account (with Video and Programmable Chat)

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
   TWILIO_API_KEY=
   TWILIO_API_SECRET=
   ```

4. Start the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Component Organization

The project follows a modular component structure:

- **UI Components**: Generic, reusable UI elements (buttons, inputs, etc.)
- **Layout Components**: Page layout elements (header, footer, navigation)
- **Feature Components**: Domain-specific components grouped by feature
- **Page Components**: Next.js page components that compose other components

## Media Device Permissions

This application requires access to your camera and microphone. Make sure to:

1. Grant browser permissions when prompted
2. Use HTTPS for local development (required for camera/mic access in some browsers)
3. If using a mobile device, ensure camera/mic permissions are enabled

## Known Issues and Troubleshooting

### Camera and Microphone Issues

- **Device not showing up**: Try refreshing the page and checking browser permissions
- **Camera/mic toggle not working**: Ensure you've completed the device setup process
- **Black screen in preview**: Check if another application is using your camera

### Connection Issues

- **Can't connect to stream**: Check your network connection and ensure the stream is active
- **"Failed to sync with server"**: Usually temporary, will auto-reconnect
- **Stream freezing**: May indicate network issues, try lowering your video quality

### Browser Compatibility

- **Best experience**: Chrome, Edge, or Firefox (latest versions)
- **Safari limitations**: Some media features may have limited support on older Safari versions
- **Mobile support**: Works on modern mobile browsers with camera/mic support

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
