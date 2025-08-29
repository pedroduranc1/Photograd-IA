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
  const initialize = useAuthStore((state) => state.initialize);

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
            
            // Initialize database tables with web-safe timeout
            if (typeof window !== 'undefined') {
              try {
                // Add timeout for web to prevent hanging
                const dbInitPromise = databaseService.initializeTables();
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Database initialization timeout')), 5000)
                );
                
                const dbResult = await Promise.race([dbInitPromise, timeoutPromise]) as any;
                if (!dbResult || !dbResult.success) {
                  console.warn('⚠️ AuthProvider: Database initialization failed or timed out on web');
                }
              } catch (error) {
                console.warn('⚠️ AuthProvider: Database initialization failed on web:', error);
                // Continue with auth initialization even if database fails
              }
            } else {
              // Native platform - initialize database normally
              const dbResult = await databaseService.initializeTables();
              if (!dbResult.success) {
                console.error('❌ AuthProvider: Database initialization failed:', dbResult.error);
                // Don't fail completely if database init fails - continue with auth
              }
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
          
          // Initialize database tables with web-safe timeout
          if (typeof window !== 'undefined') {
            try {
              // Add timeout for web to prevent hanging
              const dbInitPromise = databaseService.initializeTables();
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database initialization timeout')), 5000)
              );
              
              const dbResult = await Promise.race([dbInitPromise, timeoutPromise]) as any;
              if (!dbResult || !dbResult.success) {
                console.warn('⚠️ AuthProvider: Database initialization failed or timed out on web');
              }
            } catch (error) {
              console.warn('⚠️ AuthProvider: Database initialization failed on web:', error);
              // Continue with auth initialization even if database fails
            }
          } else {
            // Native platform - initialize database normally
            const dbResult = await databaseService.initializeTables();
            if (!dbResult.success) {
              console.error('❌ AuthProvider: Database initialization failed:', dbResult.error);
              // Don't fail completely if database init fails - continue with auth
            }
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