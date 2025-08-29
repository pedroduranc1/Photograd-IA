import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '../../services/database-service';
import type {
  PaymentFilters,
  StudentPhotoFilters,
  Payment,
  StudentPhoto,
  PaginationOptions,
} from '../../types/database';

// Payment Query Keys
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: PaymentFilters) => [...paymentKeys.lists(), { filters }] as const,
} as const;

// Student Photo Query Keys
export const studentPhotoKeys = {
  all: ['studentPhotos'] as const,
  lists: () => [...studentPhotoKeys.all, 'list'] as const,
  list: (filters: StudentPhotoFilters) => [...studentPhotoKeys.lists(), { filters }] as const,
} as const;

// Payment Hooks
export function usePayments(
  filters: PaymentFilters = {},
  pagination: PaginationOptions = {}
) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: async () => {
      const result = await databaseService.getPayments(filters, pagination);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch payments');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: Omit<Payment, 'createdAt' | 'updatedAt'>) => {
      const result = await databaseService.createPayment(payment);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create payment');
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate payment lists
      queryClient.invalidateQueries({ 
        queryKey: paymentKeys.list({ studentId: data!.studentId }) 
      });
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      // Update student details to refresh debt info
      queryClient.invalidateQueries({ 
        queryKey: ['students', 'detail', data!.studentId] 
      });
    },
  });
}

// Student Photo Hooks
export function useStudentPhotos(
  filters: StudentPhotoFilters = {},
  pagination: PaginationOptions = {}
) {
  return useQuery({
    queryKey: studentPhotoKeys.list(filters),
    queryFn: async () => {
      const result = await databaseService.getStudentPhotos(filters, pagination);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch student photos');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateStudentPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photo: Omit<StudentPhoto, 'createdAt' | 'updatedAt'>) => {
      const result = await databaseService.createStudentPhoto(photo);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create student photo');
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate photo lists
      queryClient.invalidateQueries({ 
        queryKey: studentPhotoKeys.list({ studentId: data!.studentId }) 
      });
      queryClient.invalidateQueries({ queryKey: studentPhotoKeys.lists() });
      // Update student details to refresh photo count
      queryClient.invalidateQueries({ 
        queryKey: ['students', 'detail', data!.studentId] 
      });
    },
  });
}

// Helper hooks for specific use cases
export function useStudentPayments(studentId: string, pagination?: PaginationOptions) {
  return usePayments({ studentId }, pagination);
}

export function useStudentPhotosById(studentId: string, pagination?: PaginationOptions) {
  return useStudentPhotos({ studentId }, pagination);
}

export function useSchoolPayments(schoolId: string, pagination?: PaginationOptions) {
  return usePayments({ schoolId }, pagination);
}

export function useGradePayments(gradeId: string, pagination?: PaginationOptions) {
  return usePayments({ gradeId }, pagination);
}

export function usePendingPayments(filters: PaymentFilters = {}, pagination?: PaginationOptions) {
  return usePayments({ ...filters, status: 'pending' }, pagination);
}

export function useOverduePayments(filters: PaymentFilters = {}, pagination?: PaginationOptions) {
  return usePayments({ ...filters, status: 'overdue' }, pagination);
}