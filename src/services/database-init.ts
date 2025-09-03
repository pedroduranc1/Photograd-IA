/**
 * Database Initialization and Health Check Service
 * 
 * This service provides utilities for initializing and testing the database connection,
 * including comprehensive error handling and debugging information.
 */

import { databaseService } from './database-service';

export interface DatabaseHealthCheck {
  connection: boolean;
  tables: boolean;
  basicOperations: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Comprehensive database health check
 */
export async function performDatabaseHealthCheck(): Promise<DatabaseHealthCheck> {
  const result: DatabaseHealthCheck = {
    connection: false,
    tables: false,
    basicOperations: false,
    errors: [],
    warnings: [],
  };

  try {
    // Step 1: Test connection and initialize tables
    console.log('🏥 Starting database health check...');
    
    const initResult = await databaseService.initializeTables();
    if (initResult.success) {
      result.connection = true;
      result.tables = true;
      console.log('✅ Database connection and tables: OK');
    } else {
      result.errors.push(`Table initialization failed: ${initResult.error?.message}`);
      return result;
    }

    // Step 2: Test basic CRUD operations
    try {
      const testUserId = `test-user-${Date.now()}`;
      
      // Test user profile creation
      const profileResult = await databaseService.createUserProfile({
        id: `profile-${Date.now()}`,
        userId: testUserId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      if (!profileResult.success) {
        result.errors.push(`User profile creation failed: ${profileResult.error?.message}`);
        return result;
      }

      // Test school creation
      const schoolResult = await databaseService.createSchool({
        id: `school-${Date.now()}`,
        userId: testUserId,
        name: 'Test School',
        address: '123 Test Street',
        status: 'active',
        debtAmount: 0,
      });

      if (!schoolResult.success) {
        result.errors.push(`School creation failed: ${schoolResult.error?.message}`);
        return result;
      }

      result.basicOperations = true;
      console.log('✅ Basic CRUD operations: OK');

    } catch (error) {
      result.errors.push(`CRUD operations test failed: ${error instanceof Error ? error.message : String(error)}`);
    }

  } catch (error) {
    result.errors.push(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * Initialize database with retry logic
 */
export async function initializeDatabaseWithRetry(maxRetries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Database initialization attempt ${attempt}/${maxRetries}`);
      
      const result = await databaseService.initializeTables();
      if (result.success) {
        console.log('✅ Database initialized successfully');
        return true;
      } else {
        console.warn(`⚠️ Initialization attempt ${attempt} failed:`, result.error?.message);
        if (attempt === maxRetries) {
          console.error('❌ All initialization attempts failed');
          return false;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    } catch (error) {
      console.error(`❌ Initialization attempt ${attempt} threw error:`, error);
      if (attempt === maxRetries) {
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return false;
}

/**
 * Validate environment configuration
 */
export function validateDatabaseConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.EXPO_PUBLIC_TURSO_DATABASE_URL) {
    errors.push('EXPO_PUBLIC_TURSO_DATABASE_URL is not set');
  }

  if (!process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN) {
    errors.push('EXPO_PUBLIC_TURSO_AUTH_TOKEN is not set');
  }

  // Validate URL format
  if (process.env.EXPO_PUBLIC_TURSO_DATABASE_URL) {
    const url = process.env.EXPO_PUBLIC_TURSO_DATABASE_URL;
    if (!url.startsWith('libsql://') && !url.startsWith('https://')) {
      errors.push('TURSO_DATABASE_URL must start with libsql:// or https://');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Run comprehensive database diagnostics
 */
export async function runDatabaseDiagnostics(): Promise<void> {
  console.log('🔍 Running comprehensive database diagnostics...\n');

  // 1. Configuration check
  console.log('1️⃣ Configuration validation:');
  const configCheck = validateDatabaseConfig();
  if (configCheck.valid) {
    console.log('✅ Configuration: OK');
  } else {
    console.log('❌ Configuration issues:');
    configCheck.errors.forEach(error => console.log(`   - ${error}`));
  }

  console.log('');

  // 2. Health check
  console.log('2️⃣ Database health check:');
  const healthCheck = await performDatabaseHealthCheck();
  
  console.log(`Connection: ${healthCheck.connection ? '✅' : '❌'}`);
  console.log(`Tables: ${healthCheck.tables ? '✅' : '❌'}`);
  console.log(`Basic Operations: ${healthCheck.basicOperations ? '✅' : '❌'}`);

  if (healthCheck.errors.length > 0) {
    console.log('\n❌ Errors found:');
    healthCheck.errors.forEach(error => console.log(`   - ${error}`));
  }

  if (healthCheck.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    healthCheck.warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  console.log('\n🏁 Diagnostics completed');
}