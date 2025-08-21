/**
 * Database Service Test
 * 
 * This file provides test functions to verify the Turso HTTP client works correctly
 * in React Native. Run these tests to ensure database operations work properly.
 */

import { databaseService } from './database-service';

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test basic connection by trying to create tables
    const result = await databaseService.initializeTables();
    
    if (result.success) {
      console.log('✅ Database connection successful');
      console.log('✅ Tables initialized successfully');
      return true;
    } else {
      console.error('❌ Database initialization failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

export async function testUserProfileOperations(): Promise<boolean> {
  try {
    console.log('🧪 Testing user profile operations...');
    
    const testProfile = {
      id: `test-${Date.now()}`,
      userId: `user-${Date.now()}`,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };
    
    // Create profile
    const createResult = await databaseService.createUserProfile(testProfile);
    if (!createResult.success || !createResult.data) {
      console.error('❌ Failed to create user profile:', createResult.error);
      return false;
    }
    
    console.log('✅ User profile created successfully');
    
    // Get profile
    const getResult = await databaseService.getUserProfile(testProfile.userId);
    if (!getResult.success || !getResult.data) {
      console.error('❌ Failed to get user profile:', getResult.error);
      return false;
    }
    
    console.log('✅ User profile retrieved successfully');
    
    // Update profile
    const updateResult = await databaseService.updateUserProfile(testProfile.userId, {
      firstName: 'Updated',
    });
    
    if (!updateResult.success || !updateResult.data) {
      console.error('❌ Failed to update user profile:', updateResult.error);
      return false;
    }
    
    console.log('✅ User profile updated successfully');
    
    return true;
  } catch (error) {
    console.error('❌ User profile operations test failed:', error);
    return false;
  }
}

export async function testPhotoOperations(): Promise<boolean> {
  try {
    console.log('🧪 Testing photo operations...');
    
    // First create a test user profile
    const testProfile = {
      id: `test-${Date.now()}`,
      userId: `user-${Date.now()}`,
      email: 'test@example.com',
    };
    
    await databaseService.createUserProfile(testProfile);
    
    const testPhoto = {
      id: `photo-${Date.now()}`,
      userId: testProfile.userId,
      title: 'Test Photo',
      description: 'A test photo',
      originalUrl: 'https://example.com/photo.jpg',
      status: 'processing' as const,
    };
    
    // Create photo
    const createResult = await databaseService.createPhoto(testPhoto);
    if (!createResult.success || !createResult.data) {
      console.error('❌ Failed to create photo:', createResult.error);
      return false;
    }
    
    console.log('✅ Photo created successfully');
    
    // Get photo
    const getResult = await databaseService.getPhoto(testPhoto.id);
    if (!getResult.success || !getResult.data) {
      console.error('❌ Failed to get photo:', getResult.error);
      return false;
    }
    
    console.log('✅ Photo retrieved successfully');
    
    // Get photos with filters
    const getPhotosResult = await databaseService.getPhotos(
      { userId: testProfile.userId },
      { limit: 10, offset: 0 }
    );
    
    if (!getPhotosResult.success || !getPhotosResult.data) {
      console.error('❌ Failed to get photos:', getPhotosResult.error);
      return false;
    }
    
    console.log('✅ Photos list retrieved successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Photo operations test failed:', error);
    return false;
  }
}

export async function runAllTests(): Promise<boolean> {
  console.log('🚀 Running all database tests...\n');
  
  const connectionTest = await testDatabaseConnection();
  if (!connectionTest) return false;
  
  const userProfileTest = await testUserProfileOperations();
  if (!userProfileTest) return false;
  
  const photoTest = await testPhotoOperations();
  if (!photoTest) return false;
  
  console.log('\n🎉 All database tests passed successfully!');
  return true;
}