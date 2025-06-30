# TypeScript Type Definitions

This directory contains the TypeScript type definitions used throughout the CelebFitLife application.

## Structure


- `user.ts`: Core user-related types, including User types and DTOs
- `ui.ts`: UI component props and related types
- `dashboard.ts`: Dashboard-related types
- `streamer.ts`: Streamer profile and related types
- `payment.ts`: Payment-related types
- Additional type files for other domain-specific types

## Usage Guidelines

1. **Single Source of Truth**: These type definitions should be the single source of truth for data structures in the application. Avoid duplicating types across multiple files.

2. **Import Best Practices**: When importing, use:
   - Relative imports within the `lib` directory: `import { User } from '../types/user'`
   - Absolute imports from root: `import { User } from '@/lib/types/user'`

3. **Types Only, No Functions**: This directory should contain only type definitions. Utility functions should be placed in:
   - `lib/utils/`: For general utility functions
   - `lib/helpers/`: For API and business logic-related helpers

4. **Versioning**: When making changes to these types, ensure backward compatibility or update all references.

## Types vs Interfaces

For consistency across the codebase, we use `type` declarations for all our type definitions:

- Use `type` for object types, union types, mapped types, and type aliases
- Use intersection (`&`) to combine types rather than inheritance
- Do not use `interface` - prefer `type` for all type definitions

## Extensions

If you need to extend existing types for specific use cases, use intersection types:

```typescript
type ExtendedUser = User & {
  additionalProperty: string;
}
``` 