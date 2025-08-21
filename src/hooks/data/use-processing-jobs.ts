import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { enhancedDatabaseService } from '../../services/enhanced-database-service';
import { useAuthUser } from '../../store/auth-store';
import { useAppStore, useAppSettings } from '../../store/app-store';
import { queryKeys } from '../../lib/query-keys';
import { useOptimisticMutation } from '../../lib/offline-manager';
import { useCacheCoordination } from '../../lib/state-sync';
import type { ProcessingJob, ProcessingJobFilters, PaginationOptions } from '../../types/database';
import React, { useCallback, useMemo } from 'react';

// Re-export query keys for backward compatibility
export const processingJobKeys = queryKeys.processingJobs;

// Hook to create a processing job with optimistic updates
export function useCreateProcessingJob(options: {
  optimistic?: boolean;
  priority?: 'low' | 'medium' | 'high';
} = {}) {
  const { optimistic = true, priority = 'high' } = options; // High priority for processing jobs
  const queryClient = useQueryClient();
  const authUser = useAuthUser();
  const coordinator = useCacheCoordination(queryClient);
  const appActions = useAppStore(state => ({
    addLoadingOperation: state.addLoadingOperation,
    removeLoadingOperation: state.removeLoadingOperation,
  }));

  return useMutation({
    mutationFn: async (job: Omit<ProcessingJob, 'createdAt' | 'updatedAt'>) => {
      const operationId = `create-job-${job.id || Date.now()}`;
      appActions.addLoadingOperation(operationId);
      
      try {
        const result = await enhancedDatabaseService.createProcessingJob(job);
        
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to create processing job');
        }
        
        return result.data;
      } finally {
        appActions.removeLoadingOperation(operationId);
      }
    },
    onMutate: async (job) => {
      if (!optimistic) return;
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: processingJobKeys.lists() });
      
      // Snapshot previous data
      const previousJobs = queryClient.getQueryData(
        processingJobKeys.list({ userId: authUser?.id })
      );
      
      // Optimistically add job
      const tempJob = {
        ...job,
        id: `temp_${Date.now()}`,
        status: 'pending' as const,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Add to active jobs
      queryClient.setQueryData(
        processingJobKeys.active(authUser?.id),
        (old: ProcessingJob[]) => [tempJob, ...(old || [])]
      );
      
      // Add to photo jobs
      queryClient.setQueryData(
        processingJobKeys.byPhoto(job.photoId),
        (old: ProcessingJob[]) => [tempJob, ...(old || [])]
      );
      
      return { previousJobs, tempJob };
    },
    onError: (error, job, context) => {
      // Rollback optimistic updates
      if (context?.tempJob && authUser?.id) {
        queryClient.setQueryData(
          processingJobKeys.active(authUser.id),
          (old: ProcessingJob[]) => old?.filter(j => j.id !== context.tempJob.id) || []
        );
        
        queryClient.setQueryData(
          processingJobKeys.byPhoto(job.photoId),
          (old: ProcessingJob[]) => old?.filter(j => j.id !== context.tempJob.id) || []
        );
      }
      
      console.error('Failed to create processing job:', error);
    },
    onSuccess: (data) => {
      if (data && authUser?.id) {
        // Smart cache coordination
        coordinator.coordinateUpdate(
          {
            primaryKey: processingJobKeys.detail(data.id),
            relatedKeys: [
              processingJobKeys.active(authUser.id),
              processingJobKeys.byPhoto(data.photoId),
              queryKeys.photos.detail(data.photoId),
              queryKeys.analytics.processing(authUser.id, 'day'),
            ],
            propagationType: 'invalidate',
          },
          data
        );
        
        // Set individual job cache
        queryClient.setQueryData(processingJobKeys.detail(data.id), data);
      }
    },
    retry: 3, // Always retry processing jobs
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook to get processing jobs for a photo with real-time updates
export function usePhotoProcessingJobs(
  photoId: string,
  options: {
    realtime?: boolean;
    priority?: 'low' | 'medium' | 'high';
  } = {}
) {
  const { realtime = true, priority = 'high' } = options;
  const settings = useAppSettings();
  
  // Very short stale time for processing jobs as they change frequently
  const staleTime = useMemo(() => {
    const baseTime = settings.cachePreferences.processingJobsStaleTime;
    return priority === 'high' ? baseTime * 0.5 : baseTime;
  }, [settings.cachePreferences.processingJobsStaleTime, priority]);

  return useQuery({
    queryKey: processingJobKeys.byPhoto(photoId),
    queryFn: async () => {
      // This would use a method to get jobs by photo ID
      // For now, return empty array as placeholder
      const jobs: ProcessingJob[] = [];
      return jobs;
    },
    enabled: !!photoId,
    staleTime,
    gcTime: staleTime * 2,
    refetchInterval: realtime ? 5000 : false, // 5 seconds for real-time
    refetchIntervalInBackground: realtime,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// Hook to get processing jobs for the current user with advanced filtering
export function useUserProcessingJobs(
  filters: ProcessingJobFilters = {},
  options: {
    realtime?: boolean;
    priority?: 'low' | 'medium' | 'high';
    activeOnly?: boolean;
  } = {}
) {
  const { realtime = true, priority = 'medium', activeOnly = false } = options;
  const authUser = useAuthUser();
  const settings = useAppSettings();
  
  const queryFilters = useMemo(() => ({
    ...filters,
    userId: filters.userId || authUser?.id,
    ...(activeOnly && { status: ['pending', 'processing'] as ProcessingJob['status'][] }),
  }), [filters, authUser?.id, activeOnly]);

  const staleTime = useMemo(() => {
    const baseTime = settings.cachePreferences.processingJobsStaleTime;
    return priority === 'high' ? baseTime * 0.5 : baseTime;
  }, [settings.cachePreferences.processingJobsStaleTime, priority]);

  return useQuery({
    queryKey: processingJobKeys.list(queryFilters),
    queryFn: async () => {
      if (!queryFilters.userId) {
        throw new Error('User not authenticated');
      }
      
      // Placeholder - would implement getProcessingJobs method
      const jobs: ProcessingJob[] = [];
      return jobs;
    },
    enabled: !!queryFilters.userId,
    staleTime,
    gcTime: staleTime * 2,
    refetchInterval: realtime ? 10000 : false, // 10 seconds
    refetchIntervalInBackground: realtime,
    select: useCallback((data: ProcessingJob[]) => {
      // Client-side filtering for better performance
      let filteredJobs = data;
      
      if (filters.type) {
        filteredJobs = filteredJobs.filter(job => job.type === filters.type);
      }
      
      if (filters.status) {
        filteredJobs = filteredJobs.filter(job => job.status === filters.status);
      }
      
      // Sort by priority and created date
      return filteredJobs.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[(a as any).priority || 'medium'];
        const bPriority = priorityOrder[(b as any).priority || 'medium'];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }, [filters.type, filters.status]),
  });
}

// Hook to get only active processing jobs with real-time updates
export function useActiveProcessingJobs(userId?: string) {
  const authUser = useAuthUser();
  const targetUserId = userId || authUser?.id;
  const settings = useAppSettings();

  return useQuery({
    queryKey: processingJobKeys.active(targetUserId),
    queryFn: async () => {
      if (!targetUserId) {
        throw new Error('User ID required');
      }
      
      // Placeholder for getting active jobs
      const jobs: ProcessingJob[] = [];
      return jobs;
    },
    enabled: !!targetUserId,
    staleTime: settings.cachePreferences.processingJobsStaleTime * 0.5, // Very fresh
    gcTime: settings.cachePreferences.processingJobsStaleTime,
    refetchInterval: 5000, // 5 seconds for active jobs
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    select: useCallback((data: ProcessingJob[]) => {
      // Only return jobs that are actually active
      return data.filter(job => 
        job.status === 'pending' || job.status === 'processing'
      );
    }, []),
  });
}

// Hook to get processing job history
export function useProcessingJobHistory(
  userId?: string,
  pagination: PaginationOptions = { limit: 20, offset: 0 }
) {
  const authUser = useAuthUser();
  const targetUserId = userId || authUser?.id;
  const settings = useAppSettings();

  return useQuery({
    queryKey: processingJobKeys.history(targetUserId || ''),
    queryFn: async () => {
      if (!targetUserId) {
        throw new Error('User ID required');
      }
      
      // Placeholder for getting job history
      const jobs: ProcessingJob[] = [];
      return jobs;
    },
    enabled: !!targetUserId,
    staleTime: settings.cachePreferences.processingJobsStaleTime * 2, // Less frequent updates for history
    gcTime: settings.cachePreferences.processingJobsStaleTime * 4,
    select: useCallback((data: ProcessingJob[]) => {
      // Only return completed or failed jobs
      return data
        .filter(job => job.status === 'completed' || job.status === 'failed')
        .sort((a, b) => new Date(b.completedAt || b.updatedAt).getTime() - 
                      new Date(a.completedAt || a.updatedAt).getTime());
    }, []),
  });
}

// Hook to get a single processing job with real-time updates
export function useProcessingJob(id: string, options: {
  realtime?: boolean;
  priority?: 'low' | 'medium' | 'high';
} = {}) {
  const { realtime = true, priority = 'high' } = options;
  const settings = useAppSettings();

  const staleTime = useMemo(() => {
    const baseTime = settings.cachePreferences.processingJobsStaleTime;
    return priority === 'high' ? baseTime * 0.3 : baseTime; // Very fresh for individual jobs
  }, [settings.cachePreferences.processingJobsStaleTime, priority]);

  return useQuery({
    queryKey: processingJobKeys.detail(id),
    queryFn: async () => {
      // Placeholder for getting individual job
      const job: ProcessingJob | null = null;
      return job;
    },
    enabled: !!id,
    staleTime,
    gcTime: staleTime * 2,
    refetchInterval: realtime && priority === 'high' ? 3000 : false, // 3 seconds for high priority
    refetchIntervalInBackground: realtime,
    retry: 5, // Retry more for individual jobs
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 10000),
  });
}

// Hook to update processing job with optimistic updates
export function useUpdateProcessingJob(options: {
  optimistic?: boolean;
  priority?: 'low' | 'medium' | 'high';
} = {}) {
  const { optimistic = true, priority = 'high' } = options;
  const queryClient = useQueryClient();
  const authUser = useAuthUser();
  const coordinator = useCacheCoordination(queryClient);
  
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<ProcessingJob, 'id' | 'userId' | 'createdAt'>>;
    }) => {
      // Placeholder for update method
      const updatedJob: ProcessingJob = {} as ProcessingJob;
      return updatedJob;
    },
    onMutate: async ({ id, updates }) => {
      if (!optimistic) return;
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: processingJobKeys.detail(id) });
      
      // Snapshot previous value
      const previousJob = queryClient.getQueryData(processingJobKeys.detail(id));
      
      // Optimistically update
      queryClient.setQueryData(processingJobKeys.detail(id), (old: any) => ({
        ...old,
        ...updates,
        updatedAt: new Date().toISOString(),
      }));
      
      return { previousJob };
    },
    onError: (error, { id }, context) => {
      // Rollback
      if (context?.previousJob) {
        queryClient.setQueryData(processingJobKeys.detail(id), context.previousJob);
      }
    },
    onSuccess: (data) => {
      if (data && authUser?.id) {
        // Smart invalidation
        coordinator.smartInvalidate('processingJob', data.id, authUser.id);
      }
    },
  });
}

// Hook to cancel processing job
export function useCancelProcessingJob() {
  const queryClient = useQueryClient();
  const authUser = useAuthUser();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Placeholder for cancel method
      return id;
    },
    onSuccess: (id) => {
      // Update status to cancelled
      queryClient.setQueryData(processingJobKeys.detail(id), (old: any) => ({
        ...old,
        status: 'failed',
        errorMessage: 'Cancelled by user',
        completedAt: new Date().toISOString(),
      }));
      
      // Remove from active jobs
      if (authUser?.id) {
        queryClient.setQueryData(
          processingJobKeys.active(authUser.id),
          (old: ProcessingJob[]) => old?.filter(job => job.id !== id) || []
        );
      }
    },
  });
}