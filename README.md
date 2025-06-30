# CelebFitLife

CelebFitLife is a fitness platform that connects fitness influencers with fans through interactive content and training sessions.

## Features

- **User Authentication**: Secure login and registration system
- **Dashboard**: Comprehensive streamer dashboard with analytics
- **Profile Management**: User profile customization and settings
- **Payment Integration**: Subscription and payment processing
- **Responsive Design**: Mobile-first, responsive UI design

## Project Structure

```
CelebFitLife/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Authentication routes (login, register, reset-password)
│   ├── api/                # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   └── streamers/      # Streamer data endpoints
│   ├── dashboard/          # Dashboard pages
│   ├── profile/            # User profile pages
│   ├── streaming/          # Streaming view routes
│   ├── features/           # Features showcase
│   ├── feeds/              # Content feeds
│   └── learn-more/         # Information pages
├── components/             # React components
│   ├── dashboard/          # Dashboard-specific components
│   ├── layout/             # Layout components (Header, Sidebar, etc.)
│   ├── payment/            # Payment-related components
│   ├── profile/            # Profile-specific components
│   ├── streamPage/         # Stream page components
│   └── ui/                 # Reusable UI components (shadcn/ui)
├── lib/                    # Utility libraries and configurations
│   ├── firebase/           # Firebase client and admin configurations
│   ├── helpers/            # Business logic helpers
│   │   ├── auth.ts         # Authentication helpers
│   │   └── dashboard.ts    # Dashboard data helpers
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Service classes for external APIs
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript type definitions
│   │   ├── user.ts         # User-related types
│   │   ├── dashboard.ts    # Dashboard types
│   │   ├── payment.ts      # Payment types
│   │   └── ui.ts           # UI component types
│   └── utils/              # General utility functions
├── public/                 # Static assets
└── Documentation/          # Project documentation
```

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod validation
- **Package Manager**: pnpm

## Database Structure

### Users Collection
- Authentication and profile information
- Role-based access (admin, streamer, viewer)
- User preferences and settings

### Streamers Collection  
- Streamer profiles and metadata
- Categories and tags
- Bio and avatar information

### Streams Collection
- Stream metadata and status
- Scheduling and timing information
- View counts and engagement metrics

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CelebFitLife
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with the required environment variables for Firebase configuration.

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Build for production**
   ```bash
   pnpm build
   ```

## Development Guidelines

This project follows strict engineering guidelines to ensure code quality and maintainability. Key principles include:

- **TypeScript Discipline**: All types must be defined in appropriate type files
- **Package Management**: Use pnpm exclusively
- **Code Style**: ESLint and Prettier configurations must be followed
- **File Organization**: Separation of concerns with clear directory structure
- **Authentication**: Secure Firebase-based authentication system
- **Performance**: Optimized builds and proper code splitting

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Contributing

Please follow the established code style and project structure when contributing. Ensure all builds pass and linting is clean before submitting changes.
