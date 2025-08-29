import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth-store';

// Global interval to ensure polling works even if React hooks are problematic
let globalPollingInterval: NodeJS.Timeout | null = null;
const subscribers: Set<(state: any) => void> = new Set();

/**
 * Web-compatible hook to sync with auth store state changes
 * Uses multiple strategies to ensure reliability
 */
export function useAuthStoreSync() {
  const [storeState, setStoreState] = useState(() => {
    const initialState = useAuthStore.getState();
    console.log('🔄 useAuthStoreSync: Initial state', {
      isInitialized: initialState.isInitialized,
      isLoading: initialState.isLoading,
      hasUser: !!initialState.user
    });
    return initialState;
  });
  const [forceRender, setForceRender] = useState(0);
  const isSubscribedRef = useRef(false);

  // Strategy 1: Direct store check on every render
  const currentState = useAuthStore.getState();
  if (
    currentState.isInitialized !== storeState.isInitialized ||
    currentState.isLoading !== storeState.isLoading ||
    currentState.user !== storeState.user ||
    currentState.session !== storeState.session
  ) {
    console.log('🔄 useAuthStoreSync: Direct state sync on render', {
      old: {
        isInitialized: storeState.isInitialized,
        isLoading: storeState.isLoading,
        hasUser: !!storeState.user
      },
      new: {
        isInitialized: currentState.isInitialized,
        isLoading: currentState.isLoading,
        hasUser: !!currentState.user
      }
    });
    
    // Update state immediately - this will trigger a re-render
    setStoreState(currentState);
    setForceRender(prev => prev + 1);
  }

  // Strategy 2: Global polling setup (only once)
  if (!isSubscribedRef.current) {
    isSubscribedRef.current = true;
    console.log('🔄 useAuthStoreSync: Setting up global polling');
    
    const updateFunction = (newState: any) => {
      console.log('🔄 useAuthStoreSync: Global poll triggered update');
      setStoreState(newState);
      setForceRender(prev => prev + 1);
    };
    
    subscribers.add(updateFunction);
    
    // Set up global polling if not already running
    if (!globalPollingInterval) {
      console.log('🔄 useAuthStoreSync: Starting global polling interval');
      globalPollingInterval = setInterval(() => {
        const latestState = useAuthStore.getState();
        subscribers.forEach(subscriber => subscriber(latestState));
      }, 100);
    }
  }

  // Strategy 3: useEffect as backup
  useEffect(() => {
    console.log('🔄 useAuthStoreSync: useEffect backup running');
    
    const checkState = () => {
      const state = useAuthStore.getState();
      if (
        state.isInitialized !== storeState.isInitialized ||
        state.isLoading !== storeState.isLoading
      ) {
        console.log('🔄 useAuthStoreSync: useEffect detected change');
        setStoreState(state);
        setForceRender(prev => prev + 1);
      }
    };
    
    const timer = setInterval(checkState, 200);
    return () => clearInterval(timer);
  }, []);

  console.log('🔄 useAuthStoreSync: Returning state', {
    isInitialized: storeState.isInitialized,
    isLoading: storeState.isLoading,
    hasUser: !!storeState.user,
    forceRender
  });

  return {
    ...storeState,
    isAuthenticated: Boolean(storeState.user && storeState.session),
    forceRender,
  };
}