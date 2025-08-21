import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '../../services/database-service';
import { useAuthUser } from '../../store/auth-store';
import type { UserProfile } from '../../types/database';

// Query keys
export const userProfileKeys = {
  all: ['userProfile'] as const,
  profile: (userId: string) => [...userProfileKeys.all, userId] as const,
};

// Hook to get user profile
export function useUserProfile(userId?: string) {
  const authUser = useAuthUser();
  const targetUserId = userId || authUser?.id;

  return useQuery({
    queryKey: userProfileKeys.profile(targetUserId || ''),
    queryFn: async () => {
      console.log('🔍 useUserProfile queryFn called with userId:', targetUserId);
      
      if (!targetUserId) {
        console.error('❌ No user ID provided to useUserProfile');
        throw new Error('User ID is required');
      }
      
      console.log('🗃️ Fetching user profile from database...');
      const result = await databaseService.getUserProfile(targetUserId);
      
      if (!result.success) {
        console.log('⚠️ Error fetching profile for user:', targetUserId);
        if (result.error) {
          throw new Error(result.error.message);
        }
        throw new Error('Failed to fetch user profile');
      }
      
      if (!result.data) {
        console.log('⚠️ No profile data found for user:', targetUserId);
        return null;
      }
      
      console.log('✅ Profile data retrieved successfully:', result.data.id);
      return result.data;
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      console.log(`🔄 Query retry attempt ${failureCount} for profile:`, error.message);
      return failureCount < 3;
    },
  });
}

// Hook to update user profile
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const authUser = useAuthUser();

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      const result = await databaseService.updateUserProfile(authUser.id, updates);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update profile');
      }
      return result.data;
    },
    onSuccess: (data) => {
      if (authUser?.id && data) {
        // Update the cache with the new data
        queryClient.setQueryData(userProfileKeys.profile(authUser.id), data);
        
        // Invalidate to ensure fresh data on next fetch
        queryClient.invalidateQueries({
          queryKey: userProfileKeys.profile(authUser.id),
        });
      }
    },
    onError: (error) => {
      console.error('Failed to update user profile:', error);
    },
  });
}

// Hook to create user profile (usually called during sign up)
export function useCreateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>) => {
      const result = await databaseService.createUserProfile(profile);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create profile');
      }
      return result.data;
    },
    onSuccess: (data) => {
      if (data) {
        // Add the new profile to the cache
        queryClient.setQueryData(userProfileKeys.profile(data.userId), data);
      }
    },
    onError: (error) => {
      console.error('Failed to create user profile:', error);
    },
  });
}