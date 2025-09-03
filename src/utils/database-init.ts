/**
 * Database initialization utilities
 * This module handles the automatic setup of database tables when the app starts
 */

import { databaseService } from '../services/database-service';
import { testDatabaseConnectivity } from '../services/database-test';

let isInitialized = false;
let isInitializing = false;
let initializationPromise: Promise<boolean> | null = null;

/**
 * Initialize the database tables if not already initialized
 * This should be called when the app starts or when database operations are first needed
 */
export async function initializeDatabase(): Promise<boolean> {
  // Return cached result if already initialized
  if (isInitialized) {
    return true;
  }

  // Return existing promise if already initializing
  if (isInitializing && initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  isInitializing = true;
  initializationPromise = performInitialization();

  try {
    const result = await initializationPromise;
    isInitialized = result;
    return result;
  } finally {
    isInitializing = false;
    initializationPromise = null;
  }
}

/**
 * Perform the actual database initialization
 */
async function performInitialization(): Promise<boolean> {
  console.log('🔄 Initializing database...');

  try {
    // First, test basic connectivity
    console.log('🔍 Testing database connectivity...');
    const isConnected = await testDatabaseConnectivity();
    
    if (!isConnected) {
      console.error('❌ Database connectivity test failed');
      return false;
    }

    console.log('✅ Database connectivity test passed');

    // Initialize tables
    console.log('🏗️ Creating database tables...');
    const result = await databaseService.initializeTables();

    if (result.success) {
      console.log('✅ Database initialization completed successfully');
      return true;
    } else {
      console.error('❌ Database initialization failed:', result.error?.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    return false;
  }
}

/**
 * Reset the initialization state (useful for testing or retry scenarios)
 */
export function resetDatabaseInitialization(): void {
  isInitialized = false;
  isInitializing = false;
  initializationPromise = null;
}

/**
 * Check if the database has been initialized
 */
export function isDatabaseInitialized(): boolean {
  return isInitialized;
}

/**
 * Check if the database is currently being initialized
 */
export function isDatabaseInitializing(): boolean {
  return isInitializing;
}

/**
 * Hook to ensure database is initialized before performing operations
 * This can be used in React components or services that need database access
 */
export async function ensureDatabaseReady(): Promise<boolean> {
  if (!isInitialized) {
    console.log('⚡ Database not initialized, initializing now...');
    return await initializeDatabase();
  }
  return true;
}