# CelebFitLife Utility Functions

This directory contains utility functions used throughout the CelebFitLife application. These utilities provide common functionality for media handling and authentication operations.

## Available Utilities

### Authentication Utilities (`auth.ts`)

#### `getCurrentUser`
Gets the current user from Firebase Authentication.
```typescript
const user = getCurrentUser();
```

#### `formatUserName`
Formats a user's display name for consistent presentation.
```typescript
const formattedName = formatUserName(user.displayName);
```

### Error Handling Utilities (`errors.ts`)

#### `parseFirebaseError`
Parses Firebase error codes into user-friendly messages.
```typescript
const errorMessage = parseFirebaseError(error);
```

#### `parseTwilioError`
Converts Twilio error codes into actionable error messages.
```typescript
const { message, isRecoverable } = parseTwilioError(error);
```

#### `handleNetworkErrors`
Handles network-related errors with appropriate retry strategies.
```typescript
const { shouldRetry, retryAfter, message } = handleNetworkErrors(error);
```

## File Structure

- `auth.ts` - Authentication-related utilities
- `errorHandler.ts` - Error handling and parsing utilities
- `validation.ts` - Form and data validation utilities
- `userUtils.ts` - User-related utilities
- `paymentUtils.ts` - Payment processing utilities
- `planUtils.ts` - Subscription plan utilities

## Best Practices

1. **Keep utilities pure**: Utilities should be pure functions when possible.
2. **TypeScript typing**: Use proper TypeScript types for parameters and return values.
3. **Error handling**: Include appropriate error handling.
4. **Documentation**: Document all utilities with JSDoc comments.
5. **Testing**: Write unit tests for utilities when possible.
6. **Performance**: Consider memoization for expensive operations.
7. **Browser Compatibility**: Ensure utilities work across all supported browsers.
8. **Avoid Side Effects**: Utilities should generally avoid side effects, with clear documentation when they do have them.

## Adding New Utilities

When adding new utilities, consider:
1. Is the utility general enough to be reused across the application?
2. Does it fit into an existing utility file, or should it be in a new file?
3. Is it properly typed and documented?
4. Does it follow functional programming principles where appropriate?
5. Is it thoroughly tested with edge cases?
6. Does it handle errors gracefully?

**Note:** Firebase-related utilities (Admin SDK helpers) have been consolidated into `/lib/firebase/admin.ts`. 