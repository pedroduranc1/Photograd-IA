import { databaseService } from '../services/database-service';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../types/database';

/**
 * Utility function to ensure a user profile exists in the database
 * Creates a profile if it doesn't exist
 */
export async function ensureUserProfile(user: User): Promise<void> {
  try {
    console.log('🔍 Ensuring user profile exists for user:', user.id);
    console.log('📧 User email:', user.email);
    console.log('👤 User metadata:', user.user_metadata);
    
    // First, ensure database tables are initialized
    console.log('🏗️ Initializing database tables...');
    const initResult = await databaseService.initializeTables();
    if (!initResult.success) {
      console.error('❌ Failed to initialize database tables:', initResult.error);
      throw new Error(initResult.error?.message || 'Failed to initialize database');
    }
    console.log('✅ Database tables initialized successfully');
    
    // Check if profile already exists
    console.log('🔍 Checking if profile already exists...');
    const existingProfile = await databaseService.getUserProfile(user.id);
    
    if (existingProfile.success && existingProfile.data) {
      console.log('✅ User profile already exists:', existingProfile.data.id);
      return;
    }
    
    if (!existingProfile.success) {
      console.error('⚠️ Error checking existing profile:', existingProfile.error?.message);
      // Continue to create profile anyway
    }
    
    // Create new profile
    console.log('🔧 Creating new user profile...');
    const newProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
      id: crypto.randomUUID(),
      userId: user.id,
      email: user.email!,
      firstName: user.user_metadata?.first_name || user.user_metadata?.firstName || undefined,
      lastName: user.user_metadata?.last_name || user.user_metadata?.lastName || undefined,
      avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.avatarUrl || undefined,
    };
    
    console.log('📝 Profile data to create:', newProfile);
    
    const createResult = await databaseService.createUserProfile(newProfile);
    
    if (createResult.success) {
      console.log('✅ User profile created successfully:', createResult.data?.id);
    } else {
      console.error('❌ Failed to create user profile:', createResult.error?.message);
      throw new Error(createResult.error?.message || 'Failed to create user profile');
    }
  } catch (error) {
    console.error('💥 Error in ensureUserProfile:', error);
    throw error;
  }
}

/**
 * Debug function to test database connectivity and profile operations
 */
export async function debugProfileIssues(userId: string): Promise<{
  dbConnection: boolean;
  profileExists: boolean;
  profileData: UserProfile | null;
  envCheck: boolean;
  error?: string;
  details: string[];
}> {
  const result = {
    dbConnection: false,
    profileExists: false,
    profileData: null as UserProfile | null,
    envCheck: false,
    error: undefined as string | undefined,
    details: [] as string[],
  };
  
  try {
    // Check environment variables
    console.log('🔍 Checking environment variables...');
    try {
      if (process.env.EXPO_PUBLIC_TURSO_DATABASE_URL && process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN) {
        result.envCheck = true;
        result.details.push('✅ Environment variables are configured');
      } else {
        result.details.push('❌ Missing Turso environment variables');
        result.error = 'Missing required environment variables';
      }
    } catch (envError) {
      result.details.push('❌ Error checking environment variables');
    }
    
    if (!result.envCheck) {
      return result;
    }
    
    // Test database connection
    console.log('🔗 Testing database connection...');
    const initResult = await databaseService.initializeTables();
    result.dbConnection = initResult.success;
    
    if (result.dbConnection) {
      result.details.push('✅ Database connection successful');
    } else {
      result.details.push('❌ Database connection failed');
      result.error = initResult.error?.message || 'Database connection failed';
      return result;
    }
    
    // Test profile retrieval
    console.log('👤 Testing profile retrieval for user:', userId);
    const profileResult = await databaseService.getUserProfile(userId);
    
    if (profileResult.success) {
      result.profileExists = !!profileResult.data;
      result.profileData = profileResult.data;
      
      if (result.profileExists && result.profileData) {
        result.details.push('✅ User profile found in database');
        result.details.push(`📧 Email: ${result.profileData.email}`);
        result.details.push(`👤 Name: ${result.profileData.firstName || 'N/A'} ${result.profileData.lastName || 'N/A'}`);
      } else {
        result.details.push('⚠️ No user profile found in database');
      }
    } else {
      result.details.push('❌ Profile query failed');
      result.error = profileResult.error?.message || 'Profile query failed';
    }
    
    return result;
  } catch (error: any) {
    console.error('💥 Error during debugging:', error);
    result.error = error.message || 'Unknown error during debugging';
    result.details.push(`💥 Unexpected error: ${error.message}`);
    return result;
  }
}