# TypeScript Type Definitions

This directory contains the TypeScript type definitions used throughout the CelebFitLife application.

## Structure

- `user.ts`: Core user-related types, including User interfaces and DTOs
- `streaming.ts`: Streaming-related types, including Stream, Streamer, and error types
- `auth.ts`: Authentication-related types like LoginResult

## Usage Guidelines

1. **Single Source of Truth**: These type definitions should be the single source of truth for data structures in the application. Avoid duplicating types across multiple files.

2. **Import Best Practices**: When importing, use:
   - Relative imports within the `lib` directory: `import { User } from '../types/user'`
   - Absolute imports from root: `import { User } from '@/lib/types/user'`

3. **Versioning**: When making changes to these types, ensure backward compatibility or update all references.

## Type vs Interface

As a general guideline:
- Use `interface` for object structures that might be extended
- Use `type` for union types, mapped types, or when you need type aliases

## Extensions

If you need to extend existing types for specific use cases, use interfaces and inheritance where possible:

```typescript
interface ExtendedUser extends User {
  additionalProperty: string;
}
``` 