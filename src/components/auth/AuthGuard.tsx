import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore, useIsAuthenticated, useAuthInitialized, useAuthLoading } from '../../store/auth-store';
import { Text } from '../ui/text';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useIsAuthenticated();
  const isInitialized = useAuthInitialized();
  const isLoading = useAuthLoading();
  const router = useRouter();
  const segments = useSegments();
  const initialize = useAuthStore((state) => state.initialize);

  // Note: AuthProvider already handles initialization, so we don't need to call it here again
  // This component focuses on navigation logic based on auth state

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup = segments[0] === '(protected)';

    if (!isAuthenticated && inProtectedGroup) {
      // Redirect to sign in if trying to access protected routes
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app if already authenticated
      router.replace('/(protected)');
    }
  }, [isAuthenticated, isInitialized, isLoading, segments, router]);

  // Show loading screen while initializing
  if (!isInitialized || isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="mt-4 text-muted-foreground">Loading...</Text>
      </View>
    );
  }

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