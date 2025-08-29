import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { config, validateEnvironmentVariables } from '../constants/config';
import type {
  SignUpCredentials,
  SignInCredentials,
  ResetPasswordCredentials,
  UpdatePasswordCredentials,
  UpdateProfileData,
  AuthError,
} from '../types/auth';

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    // Validate environment variables on initialization
    try {
      validateEnvironmentVariables();
    } catch (error) {
      console.error('❌ AuthService: Environment validation failed:', error);
      // On web, continue with degraded functionality
      if (typeof window === 'undefined') {
        throw error; // Re-throw on native platforms
      }
    }

    // Initialize Supabase client with web-safe configuration
    try {
      this.supabase = createClient(
        config.supabase.url || 'https://placeholder.supabase.co', 
        config.supabase.anonKey || 'placeholder-key', 
        {
          auth: {
            storage: Platform.OS !== 'web' ? ExpoSecureStoreAdapter : undefined,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: Platform.OS === 'web', // Enable URL detection on web
          },
        }
      );
    } catch (error) {
      console.error('❌ AuthService: Failed to initialize Supabase client:', error);
      // Create a minimal fallback client to prevent crashes
      this.supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
    }
  }

  // Get the Supabase client instance
  getClient() {
    return this.supabase;
  }

  // Sign up with email and password
  async signUp(credentials: SignUpCredentials) {
    try {
      const { email, password, firstName, lastName } = credentials;
      
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        throw this.handleAuthError(error);
      }

      return data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Sign in with email and password
  async signIn(credentials: SignInCredentials) {
    try {
      const { email, password } = credentials;
      
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw this.handleAuthError(error);
      }

      return data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        throw this.handleAuthError(error);
      }
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Reset password
  async resetPassword(credentials: ResetPasswordCredentials) {
    try {
      const { email } = credentials;
      
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'your-app://reset-password',
      });

      if (error) {
        throw this.handleAuthError(error);
      }
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Update password
  async updatePassword(credentials: UpdatePasswordCredentials) {
    try {
      const { newPassword } = credentials;
      
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw this.handleAuthError(error);
      }
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Update user profile
  async updateProfile(data: UpdateProfileData) {
    try {
      const { firstName, lastName, avatarUrl } = data;
      
      const { error } = await this.supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          avatar_url: avatarUrl,
        },
      });

      if (error) {
        throw this.handleAuthError(error);
      }
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Get current session
  async getSession() {
    try {
      console.log('🔐 AuthService: Getting session...');
      const { data, error } = await this.supabase.auth.getSession();
      
      console.log('🔐 AuthService: Session result', { hasData: !!data, hasSession: !!data?.session, error: error?.message });
      
      // Handle the case where there's no session (new user or logged out)
      if (error) {
        // Only throw if it's a real error, not just missing session
        if (error.message !== "Auth session missing!") {
          console.error('🔐 AuthService: Session error:', error);
          throw this.handleAuthError(error);
        }
        // For missing session, return null instead of throwing
        console.log('🔐 AuthService: No session found (expected for new users)');
        return null;
      }

      console.log('🔐 AuthService: Session retrieved successfully');
      return data.session;
    } catch (error) {
      console.error('🔐 AuthService: Session fetch failed:', error);
      // Don't throw for missing session errors - return null instead
      const authError = this.handleAuthError(error);
      if (authError.message === "Auth session missing!") {
        return null;
      }
      throw authError;
    }
  }

  // Get current user
  async getUser() {
    try {
      console.log('🔐 AuthService: Getting user...');
      const { data, error } = await this.supabase.auth.getUser();
      
      console.log('🔐 AuthService: User result', { hasData: !!data, hasUser: !!data?.user, error: error?.message });
      
      if (error) {
        // Only throw if it's a real error, not just missing session
        if (error.message !== "Auth session missing!") {
          console.error('🔐 AuthService: User error:', error);
          throw this.handleAuthError(error);
        }
        // For missing session, return null instead of throwing
        console.log('🔐 AuthService: No user found (expected for new users)');
        return null;
      }

      console.log('🔐 AuthService: User retrieved successfully');
      return data.user;
    } catch (error) {
      console.error('🔐 AuthService: User fetch failed:', error);
      // Don't throw for missing session errors - return null instead
      const authError = this.handleAuthError(error);
      if (authError.message === "Auth session missing!") {
        return null;
      }
      throw authError;
    }
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  // Private method to handle auth errors
  private handleAuthError(error: any): AuthError {
    if (error?.message) {
      return {
        message: error.message,
        code: error.status || error.code,
      };
    }
    
    return {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;