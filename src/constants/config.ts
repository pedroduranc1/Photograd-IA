// Environment configuration
export const config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  },
  turso: {
    url: process.env.EXPO_PUBLIC_TURSO_DATABASE_URL!,
    authToken: process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN!,
  },
} as const;

// Export individual constants for direct usage
export const TURSO_DATABASE_URL = process.env.EXPO_PUBLIC_TURSO_DATABASE_URL!;
export const TURSO_AUTH_TOKEN = process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN!;

// Validate required environment variables
const requiredEnvVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_TURSO_DATABASE_URL',
  'EXPO_PUBLIC_TURSO_AUTH_TOKEN',
] as const;

export function validateEnvironmentVariables() {
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
    
    // On web, log the error instead of throwing to prevent infinite hangs
    if (typeof window !== 'undefined') {
      console.error('❌ Configuration Error:', errorMessage);
      console.warn('⚠️ App may not function correctly without proper environment variables');
      return; // Don't throw on web - let the app continue with degraded functionality
    }
    
    throw new Error(errorMessage);
  }
}