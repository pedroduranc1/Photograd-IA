import '../global.css';

import { DarkTheme, DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Appearance, Platform } from 'react-native';
import { NAV_THEME } from '~/src/constants/constants';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';
import { PortalHost } from '@rn-primitives/portal';
import { ThemeToggle } from '~/src/components/layout/ThemeToggle';
import { setAndroidNavigationBar } from '~/src/utils/android-navigation-bar';
import { AuthProvider } from '~/src/components/auth/AuthProvider';
import { AuthGuard } from '~/src/components/auth/AuthGuard';
import { NetworkStatusIndicator } from '~/src/components/ui/NetworkStatusIndicator';

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

const usePlatformSpecificSetup = Platform.select({
  web: useSetWebBackgroundClassName,
  android: useSetAndroidNavigationBar,
  default: noop,
});

// Simple Web Layout
function WebRootLayout() {
  console.log('🌐 WEB LAYOUT: Using simple web-only layout');
  
  React.useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#000000';
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  console.log('🏠 RootLayout: Rendering - Platform:', Platform.OS);

  // For web, use simple layout without providers
  if (Platform.OS === 'web') {
    console.log('🌐 LAYOUT: Using web-specific layout!');
    return <WebRootLayout />;
  }

  // For mobile, use the full layout with providers
  console.log('🏠 RootLayout: Rendering mobile v3...');
  usePlatformSpecificSetup();
  const { isDarkColorScheme } = useColorScheme();

  console.log('🏠 RootLayout: Setup complete, theme:', isDarkColorScheme ? 'dark' : 'light');

  return (
    <AuthProvider>
      <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
        <StatusBar style={isDarkColorScheme ? 'light' : 'dark'} />
        <AuthGuard>
          <NetworkStatusIndicator showDiagnostics={true} />
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(protected)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </AuthGuard>
        <PortalHost />
      </ThemeProvider>
    </AuthProvider>
  );
}

const useIsomorphicLayoutEffect =
  Platform.OS === 'web' && typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

function useSetWebBackgroundClassName() {
  useIsomorphicLayoutEffect(() => {
    // Adds the background color to the html element to prevent white background on overscroll.
    document.documentElement.classList.add('bg-background');
  }, []);
}

function useSetAndroidNavigationBar() {
  React.useLayoutEffect(() => {
    setAndroidNavigationBar(Appearance.getColorScheme() ?? 'light');
  }, []);
}

function noop() {}
