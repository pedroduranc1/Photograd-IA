# Database Service Integration Guide

## Overview

The database service has been updated to use Turso's HTTP API instead of the `@libsql/client` package, which is incompatible with React Native. This ensures full compatibility across iOS, Android, and Web platforms.

## Key Changes

1. **Replaced `@libsql/client`**: Removed Node.js-dependent library
2. **Added `turso-http-client.ts`**: Custom HTTP API client for React Native
3. **Enhanced error handling**: Better network and authentication error messages
4. **Maintained API compatibility**: All existing database service methods work unchanged

## Architecture

```
┌─────────────────────┐
│   Database Service  │ ← Your application code
├─────────────────────┤
│  Turso HTTP Client  │ ← Custom React Native compatible client
├─────────────────────┤
│    Turso HTTP API   │ ← Turso's REST API
└─────────────────────┘
```

## Usage

The database service API remains unchanged:

```typescript
import { databaseService } from '~/src/services/database-service';

// Initialize tables (run once)
await databaseService.initializeTables();

// User operations
const profile = await databaseService.createUserProfile({
  id: 'user-123',
  userId: 'auth-user-456',
  email: 'user@example.com',
});

// Photo operations
const photo = await databaseService.createPhoto({
  id: 'photo-123',
  userId: 'auth-user-456',
  title: 'My Photo',
  originalUrl: 'https://example.com/photo.jpg',
  status: 'processing',
});
```

## Environment Variables

Ensure these variables are set in your `.env` file:

```bash
EXPO_PUBLIC_TURSO_DATABASE_URL=libsql://your-database-name.turso.io
EXPO_PUBLIC_TURSO_AUTH_TOKEN=your_auth_token_here
```

## Testing

Test your database integration using the provided test functions:

```typescript
import { runAllTests } from '~/src/services/database-test';

// In your app initialization or debug screen
const testResults = await runAllTests();
if (testResults) {
  console.log('Database is working correctly!');
}
```

## Error Handling

The service now provides enhanced error handling:

- **Network errors**: Connection issues, timeouts
- **Authentication errors**: Invalid credentials
- **API errors**: Turso-specific API errors
- **Database errors**: SQL execution errors

```typescript
const result = await databaseService.getUserProfile('user-123');
if (!result.success) {
  switch (result.error?.code) {
    case 'NETWORK_ERROR':
      // Handle network issues
      break;
    case 'AUTH_ERROR':
      // Handle authentication problems
      break;
    default:
      // Handle other errors
      break;
  }
}
```

## Migration Notes

- No changes needed to existing code using `databaseService`
- All database operations work exactly the same
- Better error messages and network handling
- Full React Native compatibility (iOS, Android, Web)

## Troubleshooting

### Common Issues

1. **Bundle error about Node.js modules**: Ensure `@libsql/client` is removed from `package.json`
2. **Connection failures**: Verify environment variables are set correctly
3. **401 Authentication errors**: Check your Turso auth token is valid
4. **Network timeouts**: Verify internet connection and Turso service status

### Debug Mode

Enable detailed logging by adding console logs to the HTTP client if needed. The client provides comprehensive error messages for debugging.