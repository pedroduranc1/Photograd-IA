import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth-store';

/**
 * Optimized hook to sync with auth store state changes
 * Uses Zustand's built-in subscription system
 */
export function useAuthStoreSync() {
  const subscriptionRef = useRef<(() => void) | null>(null);
  
  // Use Zustand's selector hook directly - this is optimized and won't cause loops
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  
  // Clean up any existing subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, []);

  return {
    user,
    session,
    isInitialized,
    isLoading,
    isAuthenticated: Boolean(user && session),
  };
}