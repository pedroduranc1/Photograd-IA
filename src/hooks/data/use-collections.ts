/**
 * Collection Management Hooks
 * 
 * Advanced hooks for managing photo collections with optimistic updates,
 * intelligent caching, and comprehensive collection operations.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { enhancedDatabaseService } from '../../services/enhanced-database-service';
import { useAuthUser } from '../../store/auth-store';
import { useAppStore, useAppSettings } from '../../store/app-store';
import { queryKeys } from '../../lib/query-keys';
import { useOptimisticMutation } from '../../lib/offline-manager';
import { useCacheCoordination } from '../../lib/state-sync';
import type { Collection, CollectionFilters, PaginationOptions, Photo } from '../../types/database';
import React, { useCallback, useMemo } from 'react';

// Re-export query keys for backward compatibility
export const collectionKeys = queryKeys.collections;

// Hook to get a single collection with enhanced caching
export function useCollection(id: string, options: {
  includePhotos?: boolean;
  preloadRelated?: boolean;
  priority?: 'low' | 'medium' | 'high';
} = {}) {
  const { includePhotos = false, preloadRelated = true, priority = 'medium' } = options;
  const settings = useAppSettings();
  const queryClient = useQueryClient();
  const coordinator = useCacheCoordination(queryClient);
  const authUser = useAuthUser();

  const staleTime = useMemo(() => {
    const baseTime = settings.cachePreferences.photosStaleTime * 2; // Collections change less frequently
    const multiplier = priority === 'high' ? 0.5 : priority === 'low' ? 2 : 1;
    return baseTime * multiplier;
  }, [settings.cachePreferences.photosStaleTime, priority]);

  return useQuery({
    queryKey: collectionKeys.detail(id),
    queryFn: async () => {
      const result = await enhancedDatabaseService.getCollections({ userId: authUser?.id }, { limit: 1, offset: 0 });
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch collection');
      }
      
      // Find the specific collection (placeholder logic)
      const collection = result.data?.data.find(c => c.id === id) || null;
      
      // Preload related data if enabled
      if (preloadRelated && collection && authUser?.id) {
        coordinator.preloadRelatedData('collection', id, authUser.id);
      }
      
      return collection;
    },
    enabled: !!id,
    staleTime,
    gcTime: staleTime * 2.5,
    refetchOnWindowFocus: priority === 'high',
    retry: (failureCount, error) => {
      if (priority === 'low') return failureCount < 1;
      if (priority === 'high') return failureCount < 5;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook to get collections with advanced filtering and pagination
export function useCollections(
  filters: CollectionFilters = {},
  pagination: PaginationOptions = { limit: 20, offset: 0 },
  options: {
    background?: boolean;
    prefetch?: boolean;
    priority?: 'low' | 'medium' | 'high';
  } = {}
) {
  const { background = false, prefetch = true, priority = 'medium' } = options;
  const authUser = useAuthUser();
  const settings = useAppSettings();
  const queryClient = useQueryClient();
  
  const queryFilters = useMemo(() => ({
    ...filters,
    userId: filters.userId || authUser?.id,
  }), [filters, authUser?.id]);

  const staleTime = useMemo(() => {
    const baseTime = settings.cachePreferences.photosStaleTime * 2; // Collections are more stable
    const multiplier = priority === 'high' ? 0.5 : priority === 'low' ? 2 : 1;
    return baseTime * multiplier;
  }, [settings.cachePreferences.photosStaleTime, priority]);

  return useQuery({
    queryKey: collectionKeys.list(queryFilters, pagination),
    queryFn: async () => {
      const result = await enhancedDatabaseService.getCollections(queryFilters, pagination);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch collections');
      }
      
      // Prefetch individual collections if enabled
      if (prefetch && result.data?.data) {
        result.data.data.slice(0, 3).forEach(collection => {
          queryClient.setQueryData(collectionKeys.detail(collection.id), collection);
        });
      }
      
      return result.data;
    },
    enabled: !!queryFilters.userId,
    staleTime,
    gcTime: staleTime * 2,
    refetchOnWindowFocus: priority === 'high',
    refetchInterval: background ? 300000 : false, // 5 minutes in background
    select: useCallback((data) => {
      if (!data?.data) return data;
      
      let filteredData = data.data;
      
      // Client-side filtering for better performance
      if (filters.isPublic !== undefined) {
        filteredData = filteredData.filter(collection => collection.isPublic === filters.isPublic);
      }
      
      if (filters.hasPhotos) {
        filteredData = filteredData.filter(collection => collection.photoCount > 0);
      }
      
      // Sort by update time and photo count
      filteredData = filteredData.sort((a, b) => {
        const aTime = new Date(a.updatedAt).getTime();
        const bTime = new Date(b.updatedAt).getTime();
        return bTime - aTime;
      });
      
      return { ...data, data: filteredData };
    }, [filters.isPublic, filters.hasPhotos]),
  });
}

// Hook for infinite scrolling collections
export function useInfiniteCollections(
  filters: CollectionFilters = {},
  options: {
    pageSize?: number;
    prefetchPages?: number;
    background?: boolean;
    priority?: 'low' | 'medium' | 'high';
  } = {}
) {
  const { pageSize = 12, prefetchPages = 1, background = false, priority = 'medium' } = options;
  const authUser = useAuthUser();
  const settings = useAppSettings();
  const queryClient = useQueryClient();
  
  const queryFilters = useMemo(() => ({
    ...filters,
    userId: filters.userId || authUser?.id,
  }), [filters, authUser?.id]);

  const staleTime = useMemo(() => {
    const baseTime = settings.cachePreferences.photosStaleTime * 2;
    return priority === 'high' ? baseTime * 0.5 : baseTime;
  }, [settings.cachePreferences.photosStaleTime, priority]);

  const query = useInfiniteQuery({
    queryKey: collectionKeys.infinite(queryFilters),
    queryFn: async ({ pageParam = 0 }) => {
      const result = await enhancedDatabaseService.getCollections(queryFilters, {
        limit: pageSize,
        offset: pageParam,
        orderBy: 'updated_at',
        orderDirection: 'desc',
      });
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch collections');
      }
      
      const collections = result.data?.data || [];
      
      // Cache individual collections
      collections.forEach(collection => {
        queryClient.setQueryData(collectionKeys.detail(collection.id), collection);
      });
      
      return {
        collections,
        hasMore: result.data?.hasMore || false,
        nextOffset: result.data?.nextOffset,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextOffset : undefined;
    },
    enabled: !!queryFilters.userId,
    staleTime,
    gcTime: staleTime * 2,
    refetchInterval: background ? 300000 : false, // 5 minutes
    initialPageParam: 0,
    maxPages: 8, // Limit memory usage
    select: useCallback((data) => {
      const allCollections = data.pages.flatMap(page => page.collections);
      const uniqueCollections = allCollections.filter((collection, index, self) => 
        index === self.findIndex(c => c.id === collection.id)
      );
      
      return {
        ...data,
        flatData: uniqueCollections,
        totalCount: uniqueCollections.length,
      };
    }, []),
  });

  // Prefetch next pages
  const { data, hasNextPage, fetchNextPage } = query;
  
  React.useEffect(() => {
    if (prefetchPages > 0 && hasNextPage && data?.pages.length) {
      const currentPages = data.pages.length;
      if (currentPages < prefetchPages + 1) {
        fetchNextPage();
      }
    }
  }, [data?.pages.length, hasNextPage, fetchNextPage, prefetchPages]);

  return query;
}

// Hook to get photos in a collection
export function useCollectionPhotos(
  collectionId: string,
  pagination: PaginationOptions = { limit: 20, offset: 0 },
  options: {
    background?: boolean;
    priority?: 'low' | 'medium' | 'high';
  } = {}
) {
  const { background = false, priority = 'medium' } = options;
  const settings = useAppSettings();

  const staleTime = useMemo(() => {
    const baseTime = settings.cachePreferences.photosStaleTime;
    return priority === 'high' ? baseTime * 0.5 : baseTime;
  }, [settings.cachePreferences.photosStaleTime, priority]);

  return useQuery({
    queryKey: collectionKeys.photos(collectionId),
    queryFn: async () => {
      // Placeholder for getting collection photos
      // This would typically join collections and photos tables
      const photos: Photo[] = [];
      return photos;
    },
    enabled: !!collectionId,
    staleTime,
    gcTime: staleTime * 2,
    refetchInterval: background ? 120000 : false, // 2 minutes
    select: useCallback((photos: Photo[]) => {
      // Sort photos by position in collection, then by date
      return photos.sort((a, b) => {
        // Position sorting would require additional metadata
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }, []),
  });
}

// Hook to get public collections
export function usePublicCollections(
  pagination: PaginationOptions = { limit: 20, offset: 0 },
  options: {
    trending?: boolean;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
  } = {}
) {
  const { trending = false, category, priority = 'medium' } = options;
  const settings = useAppSettings();

  const staleTime = useMemo(() => {
    const baseTime = settings.cachePreferences.photosStaleTime * 3; // Public collections change even less
    return priority === 'high' ? baseTime * 0.5 : baseTime;
  }, [settings.cachePreferences.photosStaleTime, priority]);

  return useQuery({
    queryKey: collectionKeys.public({ isPublic: true, trending, category }),
    queryFn: async () => {
      const filters: CollectionFilters = { isPublic: true };
      const result = await enhancedDatabaseService.getCollections(filters, {
        ...pagination,
        orderBy: trending ? 'view_count' : 'created_at',
        orderDirection: 'desc',
      });
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch public collections');
      }
      
      return result.data;
    },
    staleTime,
    gcTime: staleTime * 2,
    refetchOnWindowFocus: false, // Less aggressive for public content
    select: useCallback((data) => {
      if (!data?.data) return data;
      
      let filteredData = data.data;
      
      // Filter by category if specified
      if (category) {
        filteredData = filteredData.filter(collection => 
          (collection as any).category === category
        );
      }
      
      return { ...data, data: filteredData };
    }, [category]),
  });
}

// Hook to create a new collection with optimistic updates
export function useCreateCollection(options: {
  optimistic?: boolean;
  priority?: 'low' | 'medium' | 'high';
} = {}) {
  const { optimistic = true, priority = 'medium' } = options;
  const queryClient = useQueryClient();
  const authUser = useAuthUser();
  const coordinator = useCacheCoordination(queryClient);
  const appActions = useAppStore(state => ({
    addLoadingOperation: state.addLoadingOperation,
    removeLoadingOperation: state.removeLoadingOperation,
  }));

  return useMutation({
    mutationFn: async (collection: Omit<Collection, 'createdAt' | 'updatedAt' | 'photoCount'>) => {
      const operationId = `create-collection-${collection.id || Date.now()}`;
      appActions.addLoadingOperation(operationId);
      
      try {
        const result = await enhancedDatabaseService.createCollection(collection);
        
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to create collection');
        }
        
        return result.data;
      } finally {
        appActions.removeLoadingOperation(operationId);
      }
    },
    onMutate: async (collection) => {
      if (!optimistic) return;
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: collectionKeys.lists() });
      
      // Snapshot previous value
      const previousCollections = queryClient.getQueryData(
        collectionKeys.list({ userId: authUser?.id })
      );
      
      // Optimistically update lists
      queryClient.setQueryData(
        collectionKeys.list({ userId: authUser?.id }),
        (old: any) => {
          if (old?.data) {
            const tempCollection = {
              ...collection,
              id: `temp_${Date.now()}`,
              photoCount: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            return {
              ...old,
              data: [tempCollection, ...old.data],
              total: (old.total || 0) + 1,
            };
          }
          return { data: [collection], total: 1 };
        }
      );
      
      return { previousCollections };
    },
    onError: (error, collection, context) => {
      // Rollback optimistic update
      if (context?.previousCollections && authUser?.id) {
        queryClient.setQueryData(
          collectionKeys.list({ userId: authUser.id }),
          context.previousCollections
        );
      }
      
      console.error('Failed to create collection:', error);
    },
    onSuccess: (data) => {
      if (data && authUser?.id) {
        // Smart cache coordination
        coordinator.coordinateUpdate(
          {
            primaryKey: collectionKeys.detail(data.id),
            relatedKeys: [
              collectionKeys.lists(),
              collectionKeys.infinite({ userId: authUser.id }),
              queryKeys.analytics.user(authUser.id),
            ],
            propagationType: 'invalidate',
          },
          data
        );
        
        // Set individual collection cache
        queryClient.setQueryData(collectionKeys.detail(data.id), data);
      }
    },
    retry: priority === 'high' ? 3 : 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// Hook to update a collection with optimistic updates
export function useUpdateCollection(options: {
  optimistic?: boolean;
  priority?: 'low' | 'medium' | 'high';
} = {}) {
  const { optimistic = true, priority = 'medium' } = options;
  const queryClient = useQueryClient();
  const authUser = useAuthUser();
  const coordinator = useCacheCoordination(queryClient);
  const appActions = useAppStore(state => ({
    addLoadingOperation: state.addLoadingOperation,
    removeLoadingOperation: state.removeLoadingOperation,
  }));

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Omit<Collection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
    }) => {
      const operationId = `update-collection-${id}`;
      appActions.addLoadingOperation(operationId);
      
      try {
        // Placeholder for update method
        const updatedCollection: Collection = {} as Collection;
        return updatedCollection;
      } finally {
        appActions.removeLoadingOperation(operationId);
      }
    },
    onMutate: async ({ id, updates }) => {
      if (!optimistic) return;
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: collectionKeys.detail(id) });
      
      // Snapshot previous value
      const previousCollection = queryClient.getQueryData(collectionKeys.detail(id));
      
      // Optimistically update the collection
      queryClient.setQueryData(collectionKeys.detail(id), (old: any) => ({
        ...old,
        ...updates,
        updatedAt: new Date().toISOString(),
      }));
      
      // Update in lists
      const listQueries = queryClient.getQueryCache().findAll({
        queryKey: collectionKeys.lists(),
      });
      
      listQueries.forEach(query => {
        queryClient.setQueryData(query.queryKey, (old: any) => {
          if (old?.data) {
            return {
              ...old,
              data: old.data.map((collection: Collection) =>
                collection.id === id ? { ...collection, ...updates } : collection
              ),
            };
          }
          return old;
        });
      });
      
      return { previousCollection };
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic update
      if (context?.previousCollection) {
        queryClient.setQueryData(collectionKeys.detail(id), context.previousCollection);
      }
      
      console.error('Failed to update collection:', error);
    },
    onSuccess: (data) => {
      if (data && authUser?.id) {
        // Smart cache coordination
        coordinator.smartInvalidate('collection', data.id, authUser.id);
        
        // Update specific collection cache
        queryClient.setQueryData(collectionKeys.detail(data.id), data);
      }
    },
    retry: priority === 'high' ? 3 : 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// Hook to delete a collection with confirmation and optimistic updates
export function useDeleteCollection(options: {
  optimistic?: boolean;
  requireConfirmation?: boolean;
  priority?: 'low' | 'medium' | 'high';
} = {}) {
  const { optimistic = true, requireConfirmation = true, priority = 'medium' } = options;
  const queryClient = useQueryClient();
  const authUser = useAuthUser();
  const coordinator = useCacheCoordination(queryClient);
  const appActions = useAppStore(state => ({
    addLoadingOperation: state.addLoadingOperation,
    removeLoadingOperation: state.removeLoadingOperation,
    showModal: state.showModal,
  }));

  return useMutation({
    mutationFn: async (id: string) => {
      if (requireConfirmation) {
        const confirmed = await new Promise<boolean>((resolve) => {
          appActions.showModal('confirmDelete', {
            title: 'Delete Collection',
            message: 'Are you sure you want to delete this collection? This action cannot be undone.',
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });
        
        if (!confirmed) {
          throw new Error('Delete cancelled by user');
        }
      }
      
      const operationId = `delete-collection-${id}`;
      appActions.addLoadingOperation(operationId);
      
      try {
        // Placeholder for delete method
        return id;
      } finally {
        appActions.removeLoadingOperation(operationId);
      }
    },
    onMutate: async (id) => {
      if (!optimistic) return;
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: collectionKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: collectionKeys.lists() });
      
      // Snapshot previous values
      const previousCollection = queryClient.getQueryData(collectionKeys.detail(id));
      const previousLists = new Map();
      
      // Get all list queries
      const listQueries = queryClient.getQueryCache().findAll({
        queryKey: collectionKeys.lists(),
      });
      
      listQueries.forEach(query => {
        previousLists.set(JSON.stringify(query.queryKey), queryClient.getQueryData(query.queryKey));
      });
      
      // Optimistically remove from cache
      queryClient.removeQueries({ queryKey: collectionKeys.detail(id) });
      
      // Remove from lists
      listQueries.forEach(query => {
        queryClient.setQueryData(query.queryKey, (old: any) => {
          if (old?.data) {
            return {
              ...old,
              data: old.data.filter((collection: Collection) => collection.id !== id),
              total: Math.max((old.total || 0) - 1, 0),
            };
          }
          return old;
        });
      });
      
      return { previousCollection, previousLists };
    },
    onError: (error, id, context) => {
      // Rollback optimistic updates
      if (context?.previousCollection) {
        queryClient.setQueryData(collectionKeys.detail(id), context.previousCollection);
      }
      
      if (context?.previousLists) {
        context.previousLists.forEach((data, queryKeyStr) => {
          const queryKey = JSON.parse(queryKeyStr);
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      console.error('Failed to delete collection:', error);
    },
    onSuccess: (deletedId) => {
      if (authUser?.id && deletedId) {
        // Smart cache coordination for deletion
        coordinator.smartInvalidate('collection', deletedId, authUser.id);
        
        // Ensure collection is removed from all caches
        queryClient.removeQueries({ queryKey: collectionKeys.detail(deletedId) });
        
        // Invalidate analytics
        queryClient.invalidateQueries({
          queryKey: queryKeys.analytics.user(authUser.id),
        });
      }
    },
    retry: priority === 'high' ? 3 : 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// Hook to add photos to a collection
export function useAddPhotosToCollection() {
  const queryClient = useQueryClient();
  const authUser = useAuthUser();
  const coordinator = useCacheCoordination(queryClient);

  return useMutation({
    mutationFn: async ({ 
      collectionId, 
      photoIds 
    }: { 
      collectionId: string; 
      photoIds: string[];
    }) => {
      // Placeholder for adding photos to collection
      return { collectionId, photoIds, addedCount: photoIds.length };
    },
    onSuccess: ({ collectionId, addedCount }) => {
      // Update collection photo count
      queryClient.setQueryData(collectionKeys.detail(collectionId), (old: any) => {
        if (old) {
          return {
            ...old,
            photoCount: (old.photoCount || 0) + addedCount,
            updatedAt: new Date().toISOString(),
          };
        }
        return old;
      });
      
      // Invalidate collection photos
      queryClient.invalidateQueries({
        queryKey: collectionKeys.photos(collectionId),
      });
      
      // Smart invalidation
      if (authUser?.id) {
        coordinator.smartInvalidate('collection', collectionId, authUser.id);
      }
    },
  });
}

// Hook to remove photos from a collection
export function useRemovePhotosFromCollection() {
  const queryClient = useQueryClient();
  const authUser = useAuthUser();
  const coordinator = useCacheCoordination(queryClient);

  return useMutation({
    mutationFn: async ({ 
      collectionId, 
      photoIds 
    }: { 
      collectionId: string; 
      photoIds: string[];
    }) => {
      // Placeholder for removing photos from collection
      return { collectionId, photoIds, removedCount: photoIds.length };
    },
    onSuccess: ({ collectionId, removedCount }) => {
      // Update collection photo count
      queryClient.setQueryData(collectionKeys.detail(collectionId), (old: any) => {
        if (old) {
          return {
            ...old,
            photoCount: Math.max((old.photoCount || 0) - removedCount, 0),
            updatedAt: new Date().toISOString(),
          };
        }
        return old;
      });
      
      // Invalidate collection photos
      queryClient.invalidateQueries({
        queryKey: collectionKeys.photos(collectionId),
      });
      
      // Smart invalidation
      if (authUser?.id) {
        coordinator.smartInvalidate('collection', collectionId, authUser.id);
      }
    },
  });
}

// Hook to share/unshare a collection
export function useToggleCollectionSharing() {
  const queryClient = useQueryClient();
  const authUser = useAuthUser();

  return useMutation({
    mutationFn: async ({ 
      collectionId, 
      isPublic 
    }: { 
      collectionId: string; 
      isPublic: boolean;
    }) => {
      // Placeholder for toggling collection sharing
      return { collectionId, isPublic };
    },
    onMutate: async ({ collectionId, isPublic }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: collectionKeys.detail(collectionId) });
      
      // Snapshot previous value
      const previousCollection = queryClient.getQueryData(collectionKeys.detail(collectionId));
      
      // Optimistically update
      queryClient.setQueryData(collectionKeys.detail(collectionId), (old: any) => ({
        ...old,
        isPublic,
        updatedAt: new Date().toISOString(),
      }));
      
      return { previousCollection };
    },
    onError: (error, { collectionId }, context) => {
      // Rollback
      if (context?.previousCollection) {
        queryClient.setQueryData(collectionKeys.detail(collectionId), context.previousCollection);
      }
    },
    onSuccess: ({ collectionId, isPublic }) => {
      // Invalidate public collections if made public
      if (isPublic) {
        queryClient.invalidateQueries({
          queryKey: collectionKeys.public(),
        });
      }
      
      // Invalidate user's collections
      if (authUser?.id) {
        queryClient.invalidateQueries({
          queryKey: collectionKeys.list({ userId: authUser.id }),
        });
      }
    },
  });
}

export default {
  useCollection,
  useCollections,
  useInfiniteCollections,
  useCollectionPhotos,
  usePublicCollections,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
  useAddPhotosToCollection,
  useRemovePhotosFromCollection,
  useToggleCollectionSharing,
};