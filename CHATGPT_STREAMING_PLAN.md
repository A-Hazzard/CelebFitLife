# CelebFitLife Streaming Implementation Plan

## Project Overview

You are tasked with implementing a complete live streaming system for CelebFitLife, a fitness platform that connects fitness influencers with fans. This is a Next.js 15 TypeScript application with a clean codebase structure that follows strict engineering guidelines.

## Current Codebase Structure

The project has a well-organized structure with the following key directories:

```
CelebFitLife/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Authentication routes
│   ├── api/                # API routes
│   ├── dashboard/          # Dashboard pages (MAIN ENTRY POINT)
│   ├── profile/            # User profile pages
│   ├── streaming/          # Currently shows "Streaming Removed" message
│   └── ...other routes
├── components/             # React components
│   ├── dashboard/          # Dashboard components
│   ├── layout/             # Layout components
│   ├── ui/                 # Reusable UI components (shadcn/ui)
│   └── ...other components
├── lib/                    # Core utilities and configurations
│   ├── firebase/           # Firebase client and admin
│   ├── helpers/            # Business logic helpers
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Service classes
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript definitions
│   └── utils/              # Utility functions
```

## Engineering Rules & Guidelines

**CRITICAL**: This project follows strict engineering rules that are documented in the codebase. You MUST adhere to these principles:

1. **Package Management**: Use `pnpm` exclusively for all package operations
2. **TypeScript Discipline**: 
   - All types MUST be defined in appropriate type files (`lib/types/`)
   - Never use `any` type
   - Prefer `type` over `interface`
3. **File Organization**: 
   - Keep page components lean, move logic to helpers/utils
   - API logic goes in `lib/helpers/` or `lib/services/`
   - Shared utilities in `lib/utils/`
4. **Build Integrity**: Always run `pnpm build` after changes and fix any errors
5. **Code Style**: Follow ESLint rules, no warnings/errors allowed
6. **Security**: Follow OWASP standards, validate all inputs

## Streaming Technology Stack

- **Streaming Service**: Mux (for live streaming infrastructure)
- **Environment Variables**: 
  - `MUX_ACCESS_TOKEN_ID`
  - `MUX_SECRET_KEY`
- **Database**: Firebase Firestore (already configured)
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components

## Current Database Structure

Based on the Firebase collections shown, here's the current structure:

### Streams Collection
Current fields in streams documents:
```typescript
{
  id: string;
  category: string;           // e.g., "Fitness"
  commentCount: number;       // e.g., 0
  createdAt: Timestamp;       // May 8, 2025 at 9:38:42 PM UTC-4
  description: string;        // e.g., "test"
  hasEnded: boolean;          // false
  hasStarted: boolean;        // false
  isPrivate: boolean;         // false
  isScheduled: boolean;       // false
  language: string;           // e.g., "en"
  likeCount: number;          // e.g., 0
  requiresSubscription: boolean; // false
  scheduledAt: null | Timestamp;
  slug: string;               // e.g., "test-a831d4ea"
  tags: string[];             // e.g., ["strength"]
  thumbnail: string;          // Image URL
  title: string;              // e.g., "test"
  updatedAt: Timestamp;
  userId: string;             // e.g., "aaronhazzard2018@gmail.com"
  userPhotoURL: string;
  username: string;
  viewCount: number;          // e.g., 0
}
```

### Users Collection
Current user structure includes:
```typescript
{
  age: number;
  city: string;
  country: string;
  createdAt: string;
  email: string;
  isAdmin: boolean;
  password: string; // hashed
  phone: string;
  role: {
    admin: boolean;
    streamer: boolean;
    viewer: boolean;
  };
  username: string;
}
```

**Question for you**: Is this database structure suitable for the streaming system, or should we modify it? The streams collection seems well-structured, but we may need to add Mux-specific fields.

## Requirements

### 1. Stream Management Flow
**Entry Point**: When user clicks "Create Stream" button in `/dashboard` (currently redirects to dashboard)

**Required Pages**:
1. **Stream Creation/Setup Page** (`/dashboard/streams/new`)
   - Stream title, description, category
   - Thumbnail upload
   - Privacy settings
   - Scheduling options

2. **Stream Management Page** (`/dashboard/streams/manage/[slug]`)
   - **Device Tester**: Test camera, microphone, speakers
   - **Stream Controls**: Start/End stream, Mute/Unmute mic, Camera on/off
   - **Stream Status**: Live indicator, viewer count, duration
   - **Stream Settings**: Quality settings, stream key management
   - Similar to Twitch/YouTube Live studio interface

3. **Live Stream Viewer Page** (`/streaming/live/[slug]`)
   - Video player for live stream
   - Stream information (title, description, streamer info)
   - Viewer count and engagement metrics
   - Responsive design for mobile/desktop

### 2. Core Features

**Device Management**:
- Camera selection and testing
- Microphone selection and testing  
- Speaker/audio output testing
- Device permission handling
- Real-time device status indicators

**Stream Controls**:
- Start/Stop streaming
- Mute/Unmute microphone
- Enable/Disable camera
- Stream quality settings
- Stream status monitoring

**Mux Integration**:
- Create Mux live streams
- Get stream keys and playback IDs
- Monitor stream status
- Handle stream lifecycle (create, start, stop, delete)

**Viewer Experience**:
- Responsive video player
- Stream metadata display
- Real-time viewer count
- Stream status indicators (Live, Offline, etc.)

### 3. Technical Implementation

**Mux Integration Requirements**:
- Install and configure Mux SDK
- Create API routes for Mux operations
- Implement stream creation and management
- Handle Mux webhooks for status updates
- Secure API endpoints with proper authentication

**State Management**:
- Stream state (Zustand store)
- Device selection state
- User permissions state
- Real-time stream status

**API Routes Needed**:
- `POST /api/mux/streams` - Create new stream
- `GET /api/mux/streams/[id]` - Get stream details
- `POST /api/mux/streams/[id]/start` - Start stream
- `POST /api/mux/streams/[id]/stop` - Stop stream
- `DELETE /api/mux/streams/[id]` - Delete stream
- `POST /api/mux/webhooks` - Handle Mux webhooks

**Component Architecture**:
- Reusable device testing components
- Stream control panel component
- Video player component with Mux integration
- Stream status indicators
- Stream creation forms

### 4. User Experience Flow

1. **Streamer Flow**:
   - Dashboard → "Create Stream" → Stream Setup → Device Testing → Go Live → Stream Management → End Stream

2. **Viewer Flow**:
   - Browse streams → Click stream → Watch live stream → Engage with content

### 5. Authentication & Authorization

For now, you can implement this without complex authentication. Use the existing Firebase auth system but focus on the streaming functionality first. Assume users are already authenticated.

## Deliverables

Please create a comprehensive implementation plan that includes:

1. **Database Schema Updates** (if needed for Mux integration)
2. **Package Dependencies** (Mux SDK and any other required packages)
3. **File Structure** (all new files and directories to create)
4. **API Routes** (detailed implementation for each endpoint)
5. **Components** (all UI components needed)
6. **Types** (TypeScript definitions for streaming functionality)
7. **State Management** (Zustand stores for streaming state)
8. **Implementation Steps** (step-by-step development plan)

## Success Criteria

- Streamers can create, configure, and manage live streams
- Device testing works for camera, microphone, and speakers
- Live streaming works end-to-end with Mux
- Viewers can watch live streams with good quality
- All code follows the project's engineering guidelines
- Build passes without errors or warnings
- Responsive design works on mobile and desktop

## Additional Context

- The current `/dashboard` page has a "Create Stream" button that currently redirects to dashboard
- The `/streaming` page currently shows "Streaming functionality has been removed"
- The codebase is clean and follows Next.js 15 App Router patterns
- All UI should use the existing shadcn/ui components and Tailwind CSS classes
- The project uses Firebase for data persistence and user management

Please provide a detailed implementation plan that covers all aspects of building this streaming system from scratch, keeping in mind the existing codebase structure and engineering guidelines. 