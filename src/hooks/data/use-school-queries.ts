import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '../../services/database-service';
import type {
  SchoolFilters,
  SchoolWithStats,
  School,
  PaginationOptions,
} from '../../types/database';

// Query Keys
export const schoolKeys = {
  all: ['schools'] as const,
  lists: () => [...schoolKeys.all, 'list'] as const,
  list: (filters: SchoolFilters) => [...schoolKeys.lists(), { filters }] as const,
  details: () => [...schoolKeys.all, 'detail'] as const,
  detail: (id: string) => [...schoolKeys.details(), id] as const,
} as const;

// Hooks
export function useSchools(
  filters: SchoolFilters = {},
  pagination: PaginationOptions = {}
) {
  return useQuery({
    queryKey: schoolKeys.list(filters),
    queryFn: async () => {
      const result = await databaseService.getSchools(filters, pagination);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch schools');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSchool(schoolId: string) {
  return useQuery({
    queryKey: schoolKeys.detail(schoolId),
    queryFn: async () => {
      const result = await databaseService.getSchool(schoolId);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch school');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!schoolId,
  });
}

export function useCreateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (school: Omit<School, 'createdAt' | 'updatedAt'>) => {
      try {
        const result = await databaseService.createSchool(school);
        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'No se pudo crear la escuela');
        }
        return result.data;
      } catch (error) {
        console.error('Error in useCreateSchool mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch schools lists
      queryClient.invalidateQueries({ queryKey: schoolKeys.lists() });
      console.log('School created successfully:', data);
    },
    onError: (error) => {
      console.error('School creation failed:', error);
    },
  });
}

export function useUpdateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<School, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
    }) => {
      const result = await databaseService.updateSchool(id, updates);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update school');
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Update the school in cache
      queryClient.setQueryData(schoolKeys.detail(data!.id), data);
      // Invalidate lists to refresh stats
      queryClient.invalidateQueries({ queryKey: schoolKeys.lists() });
    },
  });
}

export function useDeleteSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schoolId: string) => {
      const result = await databaseService.deleteSchool(schoolId);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete school');
      }
      return result.data;
    },
    onSuccess: (_, schoolId) => {
      // Remove school from cache
      queryClient.removeQueries({ queryKey: schoolKeys.detail(schoolId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: schoolKeys.lists() });
    },
  });
}

// Helper hook to get user's schools
export function useUserSchools(userId: string, pagination?: PaginationOptions) {
  return useSchools({ userId }, pagination);
}