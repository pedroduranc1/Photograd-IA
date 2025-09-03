import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '../../services/database-service';
import type {
  GradeFilters,
  GradeWithStats,
  Grade,
  PaginationOptions,
} from '../../types/database';

// Query Keys
export const gradeKeys = {
  all: ['grades'] as const,
  lists: () => [...gradeKeys.all, 'list'] as const,
  list: (filters: GradeFilters) => [...gradeKeys.lists(), { filters }] as const,
  details: () => [...gradeKeys.all, 'detail'] as const,
  detail: (id: string) => [...gradeKeys.details(), id] as const,
} as const;

// Hooks
export function useGrades(
  filters: GradeFilters = {},
  pagination: PaginationOptions = {}
) {
  return useQuery({
    queryKey: gradeKeys.list(filters),
    queryFn: async () => {
      const result = await databaseService.getGrades(filters, pagination);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch grades');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGrade(gradeId: string) {
  return useQuery({
    queryKey: gradeKeys.detail(gradeId),
    queryFn: async () => {
      const result = await databaseService.getGrade(gradeId);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch grade');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!gradeId,
  });
}

export function useCreateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (grade: Omit<Grade, 'createdAt' | 'updatedAt'>) => {
      try {
        const result = await databaseService.createGrade(grade);
        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'No se pudo crear el grado');
        }
        return result.data;
      } catch (error) {
        console.error('Error in useCreateGrade mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate grades for the school
      queryClient.invalidateQueries({ 
        queryKey: gradeKeys.list({ schoolId: data.schoolId }) 
      });
      // Also invalidate school details to update grade count
      queryClient.invalidateQueries({ 
        queryKey: ['schools', 'detail', data.schoolId] 
      });
      console.log('Grade created successfully:', data);
    },
    onError: (error) => {
      console.error('Grade creation failed:', error);
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Grade, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>>;
    }) => {
      const result = await databaseService.updateGrade(id, updates);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update grade');
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Update the grade in cache
      queryClient.setQueryData(gradeKeys.detail(data!.id), data);
      // Invalidate lists to refresh
      queryClient.invalidateQueries({ 
        queryKey: gradeKeys.list({ schoolId: data!.schoolId }) 
      });
    },
  });
}

export function useDeleteGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gradeId: string) => {
      const result = await databaseService.deleteGrade(gradeId);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete grade');
      }
      return result.data;
    },
    onSuccess: (_, gradeId) => {
      // Remove grade from cache
      queryClient.removeQueries({ queryKey: gradeKeys.detail(gradeId) });
      // Invalidate all grade lists
      queryClient.invalidateQueries({ queryKey: gradeKeys.lists() });
      // Invalidate school lists to update counts
      queryClient.invalidateQueries({ queryKey: ['schools', 'list'] });
    },
  });
}

// Helper hook to get grades for a specific school
export function useSchoolGrades(schoolId: string, pagination?: PaginationOptions) {
  return useGrades({ schoolId }, pagination);
}