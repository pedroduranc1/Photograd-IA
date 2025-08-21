# Database Architecture Documentation

## Overview

This document outlines the comprehensive database architecture for Photograd-IA, integrating Turso database operations with Zustand state management and TanStack Query data fetching. The architecture provides a unified data management system with optimized caching, real-time updates, and robust error handling.

## Architecture Components

### 1. Core Stack
- **Turso**: Primary database with LibSQL compatibility
- **Zustand**: Global state management for UI state and authentication
- **TanStack Query**: Server state management with intelligent caching
- **Supabase**: Authentication provider

### 2. Data Flow Pattern

```
User Action → Hook → Database Service → Turso Database
     ↓           ↓            ↓              ↓
UI Update ← Cache Update ← Query Response ← Database Response
     ↓           ↓
Zustand State ← TanStack Query Cache
```

## Key Architectural Principles

### 1. Separation of Concerns
- **Database Service**: Pure database operations
- **TanStack Query**: Server state caching and synchronization
- **Zustand**: Client state and UI state management
- **Hooks**: Business logic and data access patterns

### 2. Query Key Strategy

All query keys follow a hierarchical structure:
```typescript
entityKeys = {
  all: ['entity'] as const,
  lists: () => [...entityKeys.all, 'list'] as const,
  list: (filters) => [...entityKeys.lists(), filters] as const,
  details: () => [...entityKeys.all, 'detail'] as const,
  detail: (id) => [...entityKeys.details(), id] as const,
  infinite: (filters) => [...entityKeys.all, 'infinite', filters] as const,
}
```

### 3. Cache Management Strategy

#### Stale Time Configuration
- **Real-time data** (processing jobs): 30 seconds
- **Frequently updated** (photos): 1-2 minutes
- **Stable data** (user profiles): 5 minutes
- **Static data** (collections): 10 minutes

#### Garbage Collection Time
- Short-lived data: 2-3 minutes
- Medium-lived data: 5 minutes
- Long-lived data: 10 minutes

### 4. State Synchronization Patterns

#### TanStack Query Cache Updates
```typescript
// Optimistic updates
onMutate: async (variables) => {
  await queryClient.cancelQueries({ queryKey });
  const previousData = queryClient.getQueryData(queryKey);
  queryClient.setQueryData(queryKey, optimisticData);
  return { previousData };
},

// Error rollback
onError: (error, variables, context) => {
  if (context?.previousData) {
    queryClient.setQueryData(queryKey, context.previousData);
  }
},

// Success confirmation
onSuccess: (data) => {
  queryClient.setQueryData(queryKey, data);
  queryClient.invalidateQueries({ queryKey: relatedKeys });
}
```

#### Zustand Integration
```typescript
// React to TanStack Query state changes
useEffect(() => {
  if (queryData) {
    useAppStore.getState().updateCachedData(queryData);
  }
}, [queryData]);

// Background sync from Zustand to TanStack Query
useAppStore.subscribe(
  (state) => state.backgroundSyncQueue,
  (queue) => {
    queue.forEach(syncOperation => {
      queryClient.invalidateQueries(syncOperation.queryKey);
    });
  }
);
```

## Performance Optimization Strategies

### 1. Query Optimization
- **Selective invalidation**: Only invalidate specific query keys
- **Background refetching**: Enable for frequently changing data
- **Prefetching**: Load anticipated data in advance
- **Deduplication**: Automatic request deduplication

### 2. Caching Strategies
- **Layered caching**: TanStack Query → Zustand → Local Storage
- **Cache warming**: Preload critical data
- **Cache persistence**: Persist across app restarts
- **Smart expiration**: Context-aware cache invalidation

### 3. Network Optimization
- **Request batching**: Combine multiple operations
- **Retry strategies**: Exponential backoff with jitter
- **Connection awareness**: Adapt to network conditions
- **Offline support**: Queue operations for retry

## Real-time Update Mechanisms

### 1. Polling Strategy
```typescript
// Adaptive polling based on data priority
const getRefetchInterval = (priority: 'high' | 'medium' | 'low') => {
  switch (priority) {
    case 'high': return 10000; // 10 seconds
    case 'medium': return 30000; // 30 seconds
    case 'low': return 60000; // 1 minute
  }
};
```

### 2. Background Sync
```typescript
// React Native background task integration
import BackgroundJob from 'react-native-background-job';

const backgroundSync = () => {
  BackgroundJob.on('background', () => {
    // Sync critical data
    queryClient.refetchQueries({
      queryKey: ['photos', 'processing'],
      stale: true
    });
  });
};
```

### 3. Event-driven Updates
```typescript
// Custom event system for cross-component updates
const useEventSync = () => {
  useEffect(() => {
    const handlePhotoUpdate = (event) => {
      queryClient.invalidateQueries(['photos', 'detail', event.photoId]);
    };
    
    EventBus.on('photo:updated', handlePhotoUpdate);
    return () => EventBus.off('photo:updated', handlePhotoUpdate);
  }, []);
};
```

## Error Handling Strategy

### 1. Error Classification
```typescript
enum ErrorType {
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE', 
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN'
}
```

### 2. Retry Strategies
- **Network errors**: Exponential backoff (1s, 2s, 4s, 8s)
- **Server errors**: Linear backoff (5s, 10s, 15s)
- **Authentication errors**: No retry, redirect to login
- **Validation errors**: No retry, show user feedback

### 3. Fallback Mechanisms
- **Cached data**: Show stale data with warning
- **Offline mode**: Queue operations for later
- **Graceful degradation**: Limited functionality mode

## Offline Handling

### 1. Operation Queue
```typescript
interface QueuedOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: any;
  timestamp: number;
  retryCount: number;
}
```

### 2. Conflict Resolution
- **Last-write-wins**: Simple timestamp comparison
- **Operational transformation**: For complex conflicts
- **Manual resolution**: Present conflicts to user

### 3. Sync Strategies
- **Immediate sync**: On network reconnection
- **Batched sync**: Group operations for efficiency
- **Progressive sync**: Prioritize by importance

## Data Model Patterns

### 1. Entity Relationships
```typescript
// Photo with related entities
interface PhotoWithRelations {
  photo: Photo;
  processingJobs: ProcessingJob[];
  collections: Collection[];
  tags: Tag[];
}
```

### 2. Denormalization Strategy
- **Read optimization**: Duplicate frequently accessed data
- **Write complexity**: Handle consistency across duplicates
- **Cache coherence**: Invalidate related caches

### 3. Search Optimization
```typescript
// Search with indexed fields and full-text search
interface SearchablePhoto extends Photo {
  searchVector: string; // Pre-computed search terms
  tags: string[];
  categories: string[];
}
```

## Security Considerations

### 1. Data Access Control
- **Row-level security**: User-specific data isolation
- **Query validation**: Prevent SQL injection
- **Rate limiting**: Prevent abuse

### 2. Caching Security
- **Sensitive data**: Exclude from persistent cache
- **User isolation**: Separate cache namespaces
- **Cache encryption**: Encrypt cached data

## Monitoring and Analytics

### 1. Performance Metrics
- Query execution time
- Cache hit/miss ratios
- Network request frequency
- Error rates by type

### 2. User Experience Metrics
- Loading states duration
- Offline operation success rate
- Data freshness perception
- Error recovery time

## Migration Strategy

### 1. Database Schema Evolution
- **Backward compatibility**: Support old and new schemas
- **Gradual migration**: Phase transitions over time
- **Rollback capability**: Revert problematic changes

### 2. Cache Migration
- **Version management**: Track cache schema versions
- **Automatic cleanup**: Remove obsolete cache entries
- **Progressive enhancement**: Add new features incrementally

## Implementation Guidelines

### 1. Development Workflow
1. Define data model and relationships
2. Implement database service methods
3. Create TanStack Query hooks
4. Add Zustand state integration
5. Implement error handling
6. Add optimistic updates
7. Test offline scenarios

### 2. Testing Strategy
- **Unit tests**: Database service methods
- **Integration tests**: Hook behavior with mocked data
- **E2E tests**: Full user workflows
- **Performance tests**: Load and stress testing

### 3. Code Organization
```
src/
├── services/
│   ├── database-service.ts
│   ├── cache-service.ts
│   └── sync-service.ts
├── hooks/
│   ├── data/
│   ├── queries/
│   └── mutations/
├── store/
│   ├── auth-store.ts
│   ├── app-store.ts
│   └── sync-store.ts
└── lib/
    ├── query-client.ts
    ├── query-keys.ts
    └── cache-utils.ts
```

This architecture provides a robust foundation for building a scalable, performant, and user-friendly application with seamless data management across all components.