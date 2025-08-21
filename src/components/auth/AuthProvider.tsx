import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth-store';
import { databaseService } from '../../services/database-service';
import { logConfigurationStatus } from '../../utils/config-checker';

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
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Initialize database and auth in sequence
    const init = async () => {
      try {
        // Check configuration first
        logConfigurationStatus();
        
        // Initialize database tables first
        console.log('🏗️ Initializing database tables...');
        const dbResult = await databaseService.initializeTables();
        if (dbResult.success) {
          console.log('✅ Database tables initialized successfully');
        } else {
          console.error('❌ Database initialization failed:', dbResult.error);
        }
        
        // Then initialize auth
        console.log('🔐 Initializing authentication...');
        await initialize();
        console.log('✅ Authentication initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize app services:', error);
      }
    };

    init();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}