import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { databaseService } from '../../services/database-service';
import { useAuthUser } from '../../store/auth-store';
import type { Photo, PhotoFilters, PaginationOptions } from '../../types/database';

// Query keys
export const photoKeys = {
  all: ['photos'] as const,
  lists: () => [...photoKeys.all, 'list'] as const,
  list: (filters: PhotoFilters, pagination: PaginationOptions) => 
    [...photoKeys.lists(), filters, pagination] as const,
  details: () => [...photoKeys.all, 'detail'] as const,
  detail: (id: string) => [...photoKeys.details(), id] as const,
  infinite: (filters: PhotoFilters) => [...photoKeys.all, 'infinite', filters] as const,
};

// Hook to get a single photo
export function usePhoto(id: string) {
  return useQuery({
    queryKey: photoKeys.detail(id),
    queryFn: async () => {
      const result = await databaseService.getPhoto(id);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch photo');
      }
      
      return result.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get photos with pagination
export function usePhotos(
  filters: PhotoFilters = {},
  pagination: PaginationOptions = { limit: 20, offset: 0 }
) {
  const authUser = useAuthUser();
  
  // If no userId in filters, use current user
  const queryFilters = {
    ...filters,
    userId: filters.userId || authUser?.id,
  };

  return useQuery({
    queryKey: photoKeys.list(queryFilters, pagination),
    queryFn: async () => {
      const result = await databaseService.getPhotos(queryFilters, pagination);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch photos');
      }
      
      return result.data;
    },
    enabled: !!queryFilters.userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Hook for infinite scrolling photos
export function useInfinitePhotos(filters: PhotoFilters = {}) {
  const authUser = useAuthUser();
  
  // If no userId in filters, use current user
  const queryFilters = {
    ...filters,
    userId: filters.userId || authUser?.id,
  };

  return useInfiniteQuery({
    queryKey: photoKeys.infinite(queryFilters),
    queryFn: async ({ pageParam = 0 }) => {
      const result = await databaseService.getPhotos(queryFilters, {
        limit: 20,
        offset: pageParam,
      });
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch photos');
      }
      
      return result.data?.data || [];
    },
    getNextPageParam: (lastPage) => {
      return lastPage && lastPage.length === 20 ? lastPage.length : undefined;
    },
    enabled: !!queryFilters.userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
    initialPageParam: 0,
  });
}

// Hook to create a new photo
export function useCreatePhoto() {
  const queryClient = useQueryClient();
  const authUser = useAuthUser();

  return useMutation({
    mutationFn: async (photo: Omit<Photo, 'createdAt' | 'updatedAt'>) => {
      const result = await databaseService.createPhoto(photo);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create photo');
      }
      
      return result.data;
    },
    onSuccess: (data) => {
      if (data && authUser?.id) {
        // Invalidate photo lists to include the new photo
        queryClient.invalidateQueries({
          queryKey: photoKeys.lists(),
        });
        
        // Invalidate infinite queries
        queryClient.invalidateQueries({
          queryKey: photoKeys.infinite({ userId: authUser.id }),
        });

        // Add the new photo to the cache
        queryClient.setQueryData(photoKeys.detail(data.id), data);
      }
    },
    onError: (error) => {
      console.error('Failed to create photo:', error);
    },
  });
}

// Hook to update a photo
export function useUpdatePhoto() {
  const queryClient = useQueryClient();
  const authUser = useAuthUser();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Omit<Photo, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
    }) => {
      const result = await databaseService.updatePhoto(id, updates);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update photo');
      }
      
      return result.data;
    },
    onSuccess: (data) => {
      if (data && authUser?.id) {
        // Update the specific photo in cache
        queryClient.setQueryData(photoKeys.detail(data.id), data);
        
        // Invalidate photo lists to reflect the update
        queryClient.invalidateQueries({
          queryKey: photoKeys.lists(),
        });
        
        // Invalidate infinite queries
        queryClient.invalidateQueries({
          queryKey: photoKeys.infinite({ userId: authUser.id }),
        });
      }
    },
    onError: (error) => {
      console.error('Failed to update photo:', error);
    },
  });
}

// Hook to delete a photo
export function useDeletePhoto() {
  const queryClient = useQueryClient();
  const authUser = useAuthUser();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await databaseService.deletePhoto(id);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete photo');
      }
      
      return id;
    },
    onSuccess: (deletedId) => {
      if (authUser?.id) {
        // Remove the photo from cache
        queryClient.removeQueries({
          queryKey: photoKeys.detail(deletedId),
        });
        
        // Invalidate photo lists to remove the deleted photo
        queryClient.invalidateQueries({
          queryKey: photoKeys.lists(),
        });
        
        // Invalidate infinite queries
        queryClient.invalidateQueries({
          queryKey: photoKeys.infinite({ userId: authUser.id }),
        });
      }
    },
    onError: (error) => {
      console.error('Failed to delete photo:', error);
    },
  });
}