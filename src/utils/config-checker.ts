/**
 * Configuration Checker Utility
 * 
 * This utility helps developers verify that all required environment variables
 * and services are properly configured for the Photograd-IA app.
 */

interface ConfigCheckResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
}

export function checkConfiguration(): ConfigCheckResult {
  const result: ConfigCheckResult = {
    isValid: true,
    issues: [],
    warnings: [],
    suggestions: [],
  };

  // Check environment variables
  const requiredEnvVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_TURSO_DATABASE_URL',
    'EXPO_PUBLIC_TURSO_AUTH_TOKEN',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      result.isValid = false;
      result.issues.push(`Missing environment variable: ${envVar}`);
    }
  }

  // Check Supabase URL format
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    result.warnings.push('Supabase URL should start with https://');
  }

  // Check Turso URL format
  const tursoUrl = process.env.EXPO_PUBLIC_TURSO_DATABASE_URL;
  if (tursoUrl && !tursoUrl.startsWith('libsql://') && !tursoUrl.startsWith('https://')) {
    result.warnings.push('Turso URL should start with libsql:// or https://');
  }

  // Add suggestions if there are issues
  if (result.issues.length > 0) {
    result.suggestions.push('Create a .env file in the project root with the required environment variables');
    result.suggestions.push('Restart the Expo development server after adding environment variables');
  }

  return result;
}

export function logConfigurationStatus(): void {
  console.log('🔧 Checking Photograd-IA Configuration...\n');
  
  const check = checkConfiguration();
  
  if (check.isValid) {
    console.log('✅ Configuration is valid!');
  } else {
    console.log('❌ Configuration issues found:');
    check.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (check.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    check.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  if (check.suggestions.length > 0) {
    console.log('\n💡 Suggestions:');
    check.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
  }
  
  console.log('\n📋 Required environment variables:');
  console.log('  - EXPO_PUBLIC_SUPABASE_URL');
  console.log('  - EXPO_PUBLIC_SUPABASE_ANON_KEY');  
  console.log('  - EXPO_PUBLIC_TURSO_DATABASE_URL');
  console.log('  - EXPO_PUBLIC_TURSO_AUTH_TOKEN');
  
  console.log('\n📖 For setup instructions, see SETUP.md');
}