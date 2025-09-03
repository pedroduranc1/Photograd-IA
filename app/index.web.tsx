import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

export default function WebHomePage() {
  const [darkMode, setDarkMode] = useState(false);

  console.log('🌐 WEB INDEX: Web-specific index page is rendering!');

  // Simple theme toggle
  React.useEffect(() => {
    console.log('🌐 WEB INDEX: Setting up web-specific styles...');
    document.body.style.backgroundColor = darkMode ? '#1a1a1a' : '#ffffff';
    document.body.style.color = darkMode ? '#ffffff' : '#000000';
  }, [darkMode]);

  return (
    <View className="flex-1 justify-center items-center p-8" style={{ height: '100vh' }}>
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
        Completely separate from the mobile app complexity
      </Text>

      <Pressable
        onPress={() => {
          console.log('🌐 WEB INDEX: Theme toggle pressed!');
          setDarkMode(!darkMode);
        }}
        className={`px-6 py-3 rounded-lg ${
          darkMode 
            ? 'bg-white/10 border border-white/20' 
            : 'bg-black/5 border border-black/20'
        }`}
        style={{
          padding: 16,
          borderRadius: 8,
          backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          borderWidth: 1,
          borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
        }}
      >
        <Text 
          className={`font-medium ${
            darkMode ? 'text-white' : 'text-black'
          }`}
          style={{ fontWeight: '500' }}
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </Text>
      </Pressable>
    </View>
  );
}