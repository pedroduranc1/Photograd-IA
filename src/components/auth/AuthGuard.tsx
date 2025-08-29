import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore, useIsAuthenticated, useAuthInitialized } from '../../store/auth-store';
import { Text } from '../ui/text';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [forceRender, setForceRender] = useState(() => {
    // Initialize with a timer since useEffect seems to not be working
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const checkInterval = setInterval(() => {
          setForceRender(prev => prev + 1);
        }, 500);
        
        // Clean up after 30 seconds to avoid infinite polling
        setTimeout(() => clearInterval(checkInterval), 30000);
      }, 100);
    }
    return 0;
  });
  
  // SIMPLIFIED: Get state directly on every render, no local state caching
  const directState = useAuthStore.getState();
  const { isInitialized, isLoading, user, session } = directState;
  const isAuthenticated = Boolean(user && session);
  
  const router = useRouter();
  const segments = useSegments();

  console.log('🛡️ AuthGuard: Render v13 (timer-in-state)', { 
    isAuthenticated, 
    isInitialized, 
    isLoading, 
    timeoutReached,
    forceRender,
    segments: segments[0]
  });

  // Set up timeout to prevent infinite loading (10 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized) {
        console.warn('⏰ AuthGuard: Timeout reached, forcing initialization to complete');
        setTimeoutReached(true);
        
        // Force the auth store to complete initialization on web
        if (typeof window !== 'undefined') {
          console.warn('🌐 AuthGuard: Emergency fallback - forcing auth store completion');
          const authStore = useAuthStore.getState();
          if (!authStore.isInitialized) {
            useAuthStore.setState({ isInitialized: true, isLoading: false, _isInitializing: false });
          }
        }
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isInitialized]);

  // Handle navigation based on auth state
  useEffect(() => {
    console.log('🛡️ AuthGuard: Navigation check', { 
      isInitialized, 
      isLoading, 
      timeoutReached 
    });
    
    if ((!isInitialized && !timeoutReached) || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup = segments[0] === '(protected)';

    console.log('🛡️ AuthGuard: Navigation logic', { inAuthGroup, inProtectedGroup, isAuthenticated });

    if (!isAuthenticated && inProtectedGroup) {
      // Redirect to sign in if trying to access protected routes
      console.log('🛡️ AuthGuard: Redirecting to sign in');
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app if already authenticated
      console.log('🛡️ AuthGuard: Redirecting to protected area');
      router.replace('/(protected)');
    }
  }, [isAuthenticated, isInitialized, isLoading, segments, router, timeoutReached]);

  // Show loading screen while initializing
  const shouldShowLoading = (!isInitialized && !timeoutReached) || isLoading;
  
  console.log('🛡️ AuthGuard: Loading check', { 
    shouldShowLoading, 
    isInitialized,
    isLoading, 
    timeoutReached 
  });
  
  if (shouldShowLoading) {
    const loadingText = timeoutReached ? 
      'Taking longer than expected...' : 
      'Loading...';
      
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="mt-4 text-muted-foreground">{loadingText}</Text>
        <Text className="mt-2 text-xs text-muted-foreground">
          Debug v6: init={isInitialized.toString()} loading={isLoading.toString()} timeout={timeoutReached.toString()} force={forceRender}
        </Text>
        {timeoutReached && (
          <Text className="mt-2 text-sm text-orange-500">
            If this persists, check the browser console for errors
          </Text>
        )}
      </View>
    );
  }

  console.log('🛡️ AuthGuard: Rendering children');
  return <>{children}</>;
}

// HOC for protecting specific screens
export function withAuthGuard<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const isAuthenticated = useIsAuthenticated();
    const isInitialized = useAuthInitialized();
    const router = useRouter();

    useEffect(() => {
      if (isInitialized && !isAuthenticated) {
        router.replace('/(auth)/sign-in');
      }
    }, [isAuthenticated, isInitialized, router]);

    if (!isInitialized || !isAuthenticated) {
      return (
        <View className="flex-1 justify-center items-center bg-background">
          <ActivityIndicator size="large" className="text-primary" />
          <Text className="mt-4 text-muted-foreground">Authenticating...</Text>
        </View>
      );
    }

    return <Component {...props} />;
  };
}