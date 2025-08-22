import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth-store';
import { databaseService } from '../../services/database-service';
import { logConfigurationStatus } from '../../utils/config-checker';

console.log('🚀 AuthProvider: Module loaded!');

// Create a query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  console.log('🚀 AuthProvider: Component rendering...');
  const initialize = useAuthStore((state) => state.initialize);
  console.log('🚀 AuthProvider: Initialize function obtained:', typeof initialize);

  const initializeRef = React.useRef(false);

  // Initialize auth properly without setTimeout workaround
  useEffect(() => {
    if (!initializeRef.current) {
      initializeRef.current = true;
      console.log('🚀 AuthProvider: Starting initialization...');
      
      const initializeApp = async () => {
        try {
          // Check configuration first
          console.log('🔧 AuthProvider: Checking configuration...');
          logConfigurationStatus();
          console.log('✅ AuthProvider: Configuration check complete');
          
          // Skip database init for web to test if that's the issue
          if (typeof window !== 'undefined') {
            console.log('🌐 AuthProvider: Running on web, skipping database initialization for now');
          } else {
            // Initialize database tables first
            console.log('🏗️ AuthProvider: Initializing database tables...');
            const dbResult = await databaseService.initializeTables();
            if (dbResult.success) {
              console.log('✅ AuthProvider: Database tables initialized successfully');
            } else {
              console.error('❌ AuthProvider: Database initialization failed:', dbResult.error);
              // Don't fail completely if database init fails - continue with auth
            }
          }
          
          // Then initialize auth
          console.log('🔐 AuthProvider: Starting authentication initialization...');
          await initialize();
          console.log('✅ AuthProvider: Authentication initialized successfully');
          console.log('🎉 AuthProvider: Full initialization complete!');
          
        } catch (error) {
          console.error('❌ AuthProvider: Failed to initialize app services:', error);
          // Initialize even on error to prevent infinite loading
          console.warn('⚠️ AuthProvider: Setting initialized = true despite error to prevent hang');
        }
      };
      
      initializeApp();
    }
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}