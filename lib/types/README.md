# TypeScript Type Definitions

This directory contains the TypeScript type definitions used throughout the CelebFitLife application.

## Structure

- `user.ts`: Core user-related types, including User types and DTOs
- `streaming.ts`: Streaming-related types, including Stream, Streamer, and error types
- `auth.ts`: Authentication-related types like LoginResult

## Usage Guidelines

1. **Single Source of Truth**: These type definitions should be the single source of truth for data structures in the application. Avoid duplicating types across multiple files.

2. **Import Best Practices**: When importing, use:
   - Relative imports within the `lib` directory: `import { User } from '../types/user'`
   - Absolute imports from root: `import { User } from '@/lib/types/user'`

3. **Versioning**: When making changes to these types, ensure backward compatibility or update all references.

## Types vs Interfaces

For consistency across the codebase, we use `type` declarations for all our type definitions:

- Use `type` for object types, union types, mapped types, and type aliases
- Use intersection (`&`) to combine types rather than inheritance

## Extensions

If you need to extend existing types for specific use cases, use intersection types:

```typescript
type ExtendedUser = User & {
  additionalProperty: string;
}
``` 