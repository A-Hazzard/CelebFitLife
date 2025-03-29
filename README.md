# CelebFitLife

CelebFitLife is a live streaming platform that connects fitness influencers with fans through interactive workout sessions and training content.

## Features

- **Live Streaming**: Broadcast high-quality workouts in real-time
- **Interactive Chat**: Engage with viewers during live sessions
- **Stream Scheduling**: Plan and promote upcoming sessions
- **Stream Management**: Control camera, microphone, and stream settings
- **Video Playback**: Watch recorded workout sessions
- **Responsive Design**: Optimized for desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 13 with App Router, React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Real-time Communication**: Twilio Video and Chat APIs
- **State Management**: React Context API and custom hooks
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Vercel

## Project Structure

```
├── app/                      # Next.js app router
│   ├── dashboard/            # Dashboard pages
│   │   └── streams/          # Stream management
│   ├── streaming/            # Viewer streaming pages
│   │   └── live/             # Live stream viewing
│   └── auth/                 # Authentication pages
├── components/               # Reusable React components
│   ├── ui/                   # UI components (from shadcn/ui)
│   ├── dashboard/            # Dashboard-specific components
│   └── streaming/            # Streaming-specific components
├── lib/                      # Shared utilities and helpers
│   ├── hooks/                # Custom React hooks
│   ├── helpers/              # Business logic helpers
│   └── utils/                # Utility functions
├── public/                   # Static assets
└── types/                    # TypeScript type definitions
```

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

## Project Architecture

### Module Organization

The project follows a modular architecture with clear separation of concerns:

1. **Pages (app directory)**: Defines routes and page components
2. **Components**: Reusable UI elements
3. **Hooks**: Encapsulates complex stateful logic
4. **Helpers**: Handles business logic and external service interactions
5. **Utils**: Provides utility functions for common operations

### Data Flow

1. **User Interface**: Components call hooks and helpers to perform actions
2. **Custom Hooks**: Manage state and side effects for component logic
3. **Helper Functions**: Handle external service interactions (Firebase, Twilio)
4. **Firestore**: Stores and synchronizes data in real-time
5. **Twilio**: Handles video and chat communication

## Code Conventions

- **File Naming**: Use PascalCase for components, camelCase for hooks, helpers, and utilities
- **Typing**: Use TypeScript interfaces and types for all components and functions
- **Error Handling**: Consistent error handling with typed error responses
- **Documentation**: JSDoc comments for functions and components

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
