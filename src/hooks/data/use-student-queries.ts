import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '../../services/database-service';
import type {
  StudentFilters,
  StudentWithDetails,
  Student,
  PaginationOptions,
} from '../../types/database';

// Query Keys
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters: StudentFilters) => [...studentKeys.lists(), { filters }] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
} as const;

// Hooks
export function useStudents(
  filters: StudentFilters = {},
  pagination: PaginationOptions = {}
) {
  return useQuery({
    queryKey: studentKeys.list(filters),
    queryFn: async () => {
      const result = await databaseService.getStudents(filters, pagination);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch students');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useStudent(studentId: string) {
  return useQuery({
    queryKey: studentKeys.detail(studentId),
    queryFn: async () => {
      const result = await databaseService.getStudent(studentId);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch student');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!studentId,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (student: Omit<Student, 'createdAt' | 'updatedAt'>) => {
      try {
        const result = await databaseService.createStudent(student);
        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'No se pudo crear el estudiante');
        }
        return result.data;
      } catch (error) {
        console.error('Error in useCreateStudent mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate students for the grade and school
      queryClient.invalidateQueries({ 
        queryKey: studentKeys.list({ gradeId: data.gradeId }) 
      });
      queryClient.invalidateQueries({ 
        queryKey: studentKeys.list({ schoolId: data.schoolId }) 
      });
      // Update grade and school stats
      queryClient.invalidateQueries({ 
        queryKey: ['grades', 'detail', data.gradeId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['schools', 'detail', data.schoolId] 
      });
      console.log('Student created successfully:', data);
    },
    onError: (error) => {
      console.error('Student creation failed:', error);
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Student, 'id' | 'createdAt' | 'updatedAt'>>;
    }) => {
      const result = await databaseService.updateStudent(id, updates);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update student');
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Update the student in cache
      queryClient.setQueryData(studentKeys.detail(data!.id), data);
      // Invalidate lists to refresh
      queryClient.invalidateQueries({ 
        queryKey: studentKeys.list({ gradeId: data!.gradeId }) 
      });
      queryClient.invalidateQueries({ 
        queryKey: studentKeys.list({ schoolId: data!.schoolId }) 
      });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId: string) => {
      const result = await databaseService.deleteStudent(studentId);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete student');
      }
      return result.data;
    },
    onSuccess: (_, studentId) => {
      // Remove student from cache
      queryClient.removeQueries({ queryKey: studentKeys.detail(studentId) });
      // Invalidate all student lists
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      // Invalidate grade and school lists to update counts
      queryClient.invalidateQueries({ queryKey: ['grades', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['schools', 'list'] });
    },
  });
}

// Helper hooks
export function useGradeStudents(gradeId: string, pagination?: PaginationOptions) {
  return useStudents({ gradeId }, pagination);
}

export function useSchoolStudents(schoolId: string, pagination?: PaginationOptions) {
  return useStudents({ schoolId }, pagination);
}

export function useActiveStudents(filters: StudentFilters = {}, pagination?: PaginationOptions) {
  return useStudents({ ...filters, status: 'active' }, pagination);
}