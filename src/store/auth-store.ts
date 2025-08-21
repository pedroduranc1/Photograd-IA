import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authService } from '../services/auth-service';
import { databaseService } from '../services/database-service';
import type { AuthState, AuthActions } from '../types/auth';

// Create the auth store with subscribeWithSelector middleware for listening to changes
export const useAuthStore = create<AuthState & AuthActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    user: null,
    session: null,
    isLoading: false,
    isInitialized: false,
    // Private state to track initialization attempts
    _isInitializing: false,

    // Actions
    signUp: async (credentials) => {
      set({ isLoading: true });
      try {
        const result = await authService.signUp(credentials);
        
        // If user is created and confirmed, create profile in Turso
        if (result.user && result.user.email_confirmed_at) {
          await databaseService.createUserProfile({
            id: crypto.randomUUID(),
            userId: result.user.id,
            email: result.user.email!,
            firstName: credentials.firstName,
            lastName: credentials.lastName,
          });
        }
      } catch (error) {
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    signIn: async (credentials) => {
      set({ isLoading: true });
      try {
        await authService.signIn(credentials);
        // Session will be set via the auth state change listener
      } catch (error) {
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    signOut: async () => {
      set({ isLoading: true });
      try {
        await authService.signOut();
        // State will be cleared via the auth state change listener
      } catch (error) {
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    resetPassword: async (credentials) => {
      set({ isLoading: true });
      try {
        await authService.resetPassword(credentials);
      } catch (error) {
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    updatePassword: async (credentials) => {
      set({ isLoading: true });
      try {
        await authService.updatePassword(credentials);
      } catch (error) {
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    updateProfile: async (data) => {
      set({ isLoading: true });
      try {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        // Update profile in Supabase
        await authService.updateProfile(data);
        
        // Update profile in Turso
        await databaseService.updateUserProfile(user.id, {
          firstName: data.firstName,
          lastName: data.lastName,
          avatarUrl: data.avatarUrl,
        });

        // Refresh user data
        const updatedUser = await authService.getUser();
        if (updatedUser) {
          set({ user: updatedUser });
        }
      } catch (error) {
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    initialize: async () => {
      const { _isInitializing, isInitialized } = get();
      
      // Prevent multiple initialization attempts
      if (_isInitializing || isInitialized) {
        return;
      }

      try {
        set({ isLoading: true, _isInitializing: true });
        
        // Wait a small amount to ensure Supabase has time to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get current session and user - these now handle missing sessions gracefully
        const [session, user] = await Promise.all([
          authService.getSession(),
          authService.getUser()
        ]);

        set({ 
          user: user || null, 
          session: session || null, 
          isInitialized: true 
        });

        // Set up auth state change listener (only once)
        authService.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id);
          
          if (event === 'SIGNED_IN' && session) {
            set({ user: session.user, session });
            
            // Create user profile in Turso if it doesn't exist
            if (session.user) {
              try {
                const profileResult = await databaseService.getUserProfile(session.user.id);
                if (!profileResult.data && profileResult.success) {
                  await databaseService.createUserProfile({
                    id: crypto.randomUUID(),
                    userId: session.user.id,
                    email: session.user.email!,
                    firstName: session.user.user_metadata?.first_name,
                    lastName: session.user.user_metadata?.last_name,
                    avatarUrl: session.user.user_metadata?.avatar_url,
                  });
                }
              } catch (profileError) {
                console.warn('Failed to create user profile:', profileError);
                // Don't throw - profile creation is not critical for auth
              }
            }
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, session: null });
          } else if (event === 'TOKEN_REFRESHED' && session) {
            set({ user: session.user, session });
          }
        });
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Set initialized to true even on error to prevent infinite retry loops
        set({ isInitialized: true });
      } finally {
        set({ isLoading: false, _isInitializing: false });
      }
    },

    // Direct setters for internal use
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setLoading: (loading) => set({ isLoading: loading }),
  }))
);

// Selectors for easy access to specific state slices
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthSession = () => useAuthStore((state) => state.session);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthInitialized = () => useAuthStore((state) => state.isInitialized);
export const useIsAuthenticated = () => useAuthStore((state) => Boolean(state.user && state.session));

// Auth actions selectors - Fixed to prevent getSnapshot infinite loop
export const useAuthActions = () => {
  // Get individual action functions from the store
  const signUp = useAuthStore((state) => state.signUp);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const initialize = useAuthStore((state) => state.initialize);

  // Memoize the returned object to prevent creating new references on every render
  return useMemo(() => ({
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    initialize,
  }), [signUp, signIn, signOut, resetPassword, updatePassword, updateProfile, initialize]);
};