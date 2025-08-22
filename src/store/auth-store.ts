import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authService } from '../services/auth-service';
import { databaseService } from '../services/database-service';
import type { AuthState, AuthActions } from '../types/auth';

// Web-compatible UUID generation
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
            id: generateId(),
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
      
      console.log('🔐 AuthStore: Initialize called', { _isInitializing, isInitialized });
      
      // Prevent multiple initialization attempts
      if (_isInitializing || isInitialized) {
        console.log('🔐 AuthStore: Already initializing or initialized, skipping');
        return;
      }

      try {
        console.log('🔐 AuthStore: Setting loading and initializing state...');
        set({ isLoading: true, _isInitializing: true });
        
        // Wait a small amount to ensure Supabase has time to initialize
        console.log('🔐 AuthStore: Waiting for Supabase initialization...');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get current session and user - these now handle missing sessions gracefully
        console.log('🔐 AuthStore: Getting current session and user...');
        
        // Add timeout to prevent hanging
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), 8000)
        );
        
        const [session, user] = await Promise.race([
          Promise.all([
            authService.getSession(),
            authService.getUser()
          ]),
          timeout
        ]) as [any, any];

        console.log('🔐 AuthStore: Session and user retrieved', { 
          hasSession: !!session, 
          hasUser: !!user,
          userId: user?.id 
        });

        set({ 
          user: user || null, 
          session: session || null, 
          isInitialized: true 
        });

        console.log('🔐 AuthStore: Setting up auth state change listener...');
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
                    id: generateId(),
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
        
        console.log('✅ AuthStore: Auth state change listener set up successfully');
      } catch (error) {
        console.error('❌ AuthStore: Failed to initialize auth:', error);
        // Set initialized to true even on error to prevent infinite retry loops
        set({ isInitialized: true });
      } finally {
        console.log('🔐 AuthStore: Finalizing initialization...');
        set({ isLoading: false, _isInitializing: false });
        console.log('✅ AuthStore: Initialization complete!');
      }
    },

    // Direct setters for internal use
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setLoading: (loading) => set({ isLoading: loading }),
  }))
);

// Selectors for easy access to specific state slices
export const useAuthUser = () => {
  const user = useAuthStore((state) => state.user);
  console.log('🔍 useAuthUser:', !!user);
  return user;
};
export const useAuthSession = () => useAuthStore((state) => state.session);
export const useAuthLoading = () => {
  const loading = useAuthStore((state) => state.isLoading);
  console.log('🔍 useAuthLoading:', loading);
  return loading;
};
export const useAuthInitialized = () => {
  const initialized = useAuthStore((state) => state.isInitialized);
  console.log('🔍 useAuthInitialized:', initialized);
  return initialized;
};
export const useIsAuthenticated = () => {
  const authenticated = useAuthStore((state) => Boolean(state.user && state.session));
  console.log('🔍 useIsAuthenticated:', authenticated);
  return authenticated;
};

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