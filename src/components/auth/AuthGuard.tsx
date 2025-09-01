import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore, useIsAuthenticated, useAuthInitialized, useAuthLoading } from '../../store/auth-store';
import { Text } from '../ui/text';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  // Use the optimized selectors to prevent getSnapshot issues
  const isInitialized = useAuthInitialized();
  const isLoading = useAuthLoading();
  const isAuthenticated = useIsAuthenticated();
  
  const router = useRouter();
  const segments = useSegments();

  console.log('🛡️ AuthGuard: Render (optimized)', { 
    isAuthenticated, 
    isInitialized, 
    isLoading, 
    timeoutReached,
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

  // Handle navigation based on auth state - memoize to prevent unnecessary runs
  useEffect(() => {
    // Only run navigation logic when fully initialized
    if ((!isInitialized && !timeoutReached) || isLoading) {
      console.log('🛡️ AuthGuard: Still loading, skipping navigation');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup = segments[0] === '(protected)';

    console.log('🛡️ AuthGuard: Navigation check', { 
      inAuthGroup, 
      inProtectedGroup, 
      isAuthenticated,
      currentSegment: segments[0]
    });

    if (!isAuthenticated && inProtectedGroup) {
      console.log('🛡️ AuthGuard: Redirecting to sign in');
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && inAuthGroup) {
      console.log('🛡️ AuthGuard: Redirecting to protected area');
      router.replace('/(protected)');
    }
  }, [isAuthenticated, isInitialized, timeoutReached, segments[0], router]); // Simplified dependencies

  // Show loading screen while initializing
  const shouldShowLoading = (!isInitialized && !timeoutReached) || isLoading;
  
  if (shouldShowLoading) {
    const loadingText = timeoutReached ? 
      'Taking longer than expected...' : 
      'Loading...';
      
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="mt-4 text-muted-foreground">{loadingText}</Text>
        <Text className="mt-2 text-xs text-muted-foreground">
          Debug: init={isInitialized.toString()} loading={isLoading.toString()} timeout={timeoutReached.toString()}
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