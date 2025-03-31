# CelebFitLife Client Library Structure

This directory contains the client-side libraries, utilities, and services used throughout the CelebFitLife application.

## Directory Structure

- **config/**: Configuration files and initialization
  - `firebase.ts`: Firebase client-side configuration
  
- **helpers/**: Simple helper functions for common tasks
  - `auth.ts`: Authentication helper functions
  - `streaming.ts`: Streaming helper functions
  
- **hooks/**: React hooks for component logic
  - Various custom hooks for forms, authentication, and streaming

- **models/**: Data models and interfaces
  - Definition of data structures used throughout the application
  
- **services/**: Client-side services that handle business logic
  - `AuthService.ts`: Handles authentication operations
  - `ClientTwilioService.ts`: Handles Twilio video operations on the client
  - `ChatService.ts`: Manages chat functionality
  - `streamingService.ts`: Handles streaming operations
  - `paymentService.ts`: Manages payment processing
  
- **store/**: State management
  - Zustand/Redux stores for global state

- **types/**: TypeScript type definitions
  - `user.ts`: User-related type definitions
  - `streaming.ts`: Streaming-related type definitions
  
- **utils/**: Utility functions
  - `twilio.ts`: Utilities for Twilio video
  - `streaming.ts`: Utilities for streaming
  - `logger.ts`: Logging utilities

## Separation of Concerns

### Client vs Server

- `lib/` contains client-side code that runs in the browser
- `app/api/lib/` contains server-side code that runs on the server

### Services vs. Utils vs. Helpers

- **Services** contain stateful logic and business rules
- **Utils** are pure functions for data manipulation
- **Helpers** are simple convenience functions for common tasks

## Usage Guidelines

1. When adding new functionality, consider where it belongs based on the above structure
2. Keep related code in the same directory
3. Avoid circular dependencies by maintaining proper layering 