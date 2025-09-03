import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInitializeAuth } from '../../store/auth-store';
import { logConfigurationStatus } from '../../utils/config-checker';
import { initializeDatabase } from '../../utils/database-init';

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
  const initialize = useInitializeAuth();

  const initializeRef = React.useRef(false);
  const hasTriggeredInit = React.useRef(false);

  // Immediately trigger initialization if not already done
  if (!hasTriggeredInit.current) {
    hasTriggeredInit.current = true;
    
    // Use setTimeout to allow the component to fully render first
    setTimeout(() => {
      if (!initializeRef.current) {
        initializeRef.current = true;
        
        const initializeApp = async () => {
          try {
            // Check configuration first
            logConfigurationStatus();
            
            // Initialize database
            try {
              console.log('🔄 AuthProvider: Initializing database...');
              const dbSuccess = await initializeDatabase();
              if (dbSuccess) {
                console.log('✅ AuthProvider: Database initialization successful');
              } else {
                console.warn('⚠️ AuthProvider: Database initialization failed');
              }
            } catch (error) {
              console.warn('⚠️ AuthProvider: Database initialization error:', error);
              // Continue with auth initialization even if database fails
            }
            
            // Then initialize auth
            await initialize();
            
          } catch (error) {
            console.error('❌ AuthProvider: Failed to initialize app services:', error);
          }
        };
        
        initializeApp();
      }
    }, 100); // Small delay to ensure component is mounted
  }

  // Backup useEffect as fallback
  useEffect(() => {
    if (!initializeRef.current) {
      initializeRef.current = true;
      
      // Emergency fallback timer for web - forces initialization to complete after 8 seconds
      let emergencyFallback: NodeJS.Timeout | null = null;
      if (typeof window !== 'undefined') {
        emergencyFallback = setTimeout(() => {
          initialize().catch((error) => {
            console.error('Emergency initialization failed:', error);
          });
        }, 8000);
      }
      
      const initializeApp = async () => {
        try {
          // Check configuration first
          logConfigurationStatus();
          
          // Initialize database
          try {
            console.log('🔄 AuthProvider: Initializing database (fallback)...');
            const dbSuccess = await initializeDatabase();
            if (dbSuccess) {
              console.log('✅ AuthProvider: Database initialization successful (fallback)');
            } else {
              console.warn('⚠️ AuthProvider: Database initialization failed (fallback)');
            }
          } catch (error) {
            console.warn('⚠️ AuthProvider: Database initialization error (fallback):', error);
            // Continue with auth initialization even if database fails
          }
          
          // Then initialize auth
          await initialize();
          
          // Clear emergency fallback if initialization completed successfully
          if (emergencyFallback) {
            clearTimeout(emergencyFallback);
          }
          
        } catch (error) {
          console.error('❌ AuthProvider: Failed to initialize app services:', error);
          
          // Clear emergency fallback since we're handling the error
          if (emergencyFallback) {
            clearTimeout(emergencyFallback);
          }
        }
      };
      
      initializeApp();
    }
  }, []); // Empty dependency array to run only once

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}