import { Redirect } from 'expo-router';
import { Platform, View, Text, Pressable } from 'react-native';
import React, { useState } from 'react';
import { useIsAuthenticated, useAuthInitialized } from '~/src/store/auth-store';

// Simple Web Component
function WebHomePage() {
  const [darkMode, setDarkMode] = useState(false);

  console.log('🌐 WEB INDEX: Web-specific index page is rendering! (Updated)');

  // Simple theme toggle
  React.useEffect(() => {
    console.log('🌐 WEB INDEX: Setting up web-specific styles...');
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = darkMode ? '#1a1a1a' : '#ffffff';
      document.body.style.color = darkMode ? '#ffffff' : '#000000';
    }
  }, [darkMode]);

  return (
    <View className="flex-1 justify-center items-center p-8">
      <Text 
        className={`text-4xl font-bold mb-8 ${
          darkMode ? 'text-white' : 'text-black'
        }`}
        style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 32 }}
      >
        Hello World (Web Only)
      </Text>
      
      <Text 
        className={`text-lg mb-8 text-center ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}
        style={{ fontSize: 18, marginBottom: 32, textAlign: 'center' }}
      >
        This is a simple, isolated web implementation
      </Text>
      
      <Text 
        className={`text-sm mb-8 text-center ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}
        style={{ fontSize: 14, marginBottom: 32, textAlign: 'center' }}
      >
        Completely separate from the mobile app complexity - no auth, no database, no providers!
      </Text>

      <Pressable
        onPress={() => {
          console.log('🌐 WEB INDEX: Theme toggle pressed!');
          setDarkMode(!darkMode);
        }}
        style={{
          padding: 16,
          borderRadius: 8,
          backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          borderWidth: 1,
          borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
        }}
      >
        <Text 
          style={{ fontWeight: '500', color: darkMode ? '#ffffff' : '#000000' }}
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </Text>
      </Pressable>
    </View>
  );
}

export default function IndexScreen() {
  console.log('📍 IndexScreen render - Platform:', Platform.OS);

  // For web, show simple Hello World
  if (Platform.OS === 'web') {
    return <WebHomePage />;
  }

  // For mobile, use the original authentication logic
  const isAuthenticated = useIsAuthenticated();
  const isInitialized = useAuthInitialized();
  
  console.log('📍 IndexScreen render (mobile)', { isAuthenticated, isInitialized });

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