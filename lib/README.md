# /lib Directory

This directory contains the core logic, utilities, types, hooks, and configuration files for the CelebFitLife application.

## Structure

*   `/config`: Contains configuration files for external services like Twilio. **Note:** Firebase configuration has been moved and consolidated.
*   `/firebase`: Contains the centralized Firebase client (`client.ts`) and admin (`admin.ts`) SDK initializations and related utility functions.
*   `/helpers`: Contains helper functions specific to certain application features (e.g., authentication flows, dashboard data).
*   `/hooks`: Contains custom React hooks used throughout the application.
*   `/models`: Defines data structures and types used across the application.
*   `/services`: Includes service classes abstracting interactions with external APIs (e.g., Twilio).
*   `/store`: Holds Zustand state management stores for global application state.
*   `/types`: Contains shared TypeScript type definitions.
*   `/utils`: Provides general utility functions (e.g., validation, type checking, date formatting).

## Usage

Modules within `/lib` can be imported using the `@/lib/...` path alias.

*   For client-side Firebase access (Auth, Firestore), import from `@/lib/firebase/client`.
*   For server-side Firebase Admin SDK access (Admin Auth, Admin Firestore), import from `@/lib/firebase/admin`.
*   Other utilities and types can be imported directly from their respective subdirectories (e.g., `@/lib/utils`, `@/lib/types`).

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