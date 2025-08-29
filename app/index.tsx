import { Redirect } from 'expo-router';
import { useIsAuthenticated, useAuthInitialized } from '~/src/store/auth-store';

export default function IndexScreen() {
  const isAuthenticated = useIsAuthenticated();
  const isInitialized = useAuthInitialized();
  
  console.log('📍 IndexScreen render', { isAuthenticated, isInitialized });

  // Don't redirect until auth is initialized
  if (!isInitialized) {
    return null;
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/(protected)" />;
  } else {
    return <Redirect href="/(auth)/sign-in" />;
  }
}