import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { ThemeToggle } from '../../src/components/layout/ThemeToggle';
import { Home } from '../../src/components/ui/icons/Home';
import { GraduationCap } from '../../src/components/ui/icons/GraduationCap';
import { CreditCard } from '../../src/components/ui/icons/CreditCard';
import { User } from '../../src/components/ui/icons/User';
import { useColorScheme } from '../../src/hooks/ui/useColorScheme';

export default function ProtectedLayout() {
  const { isDarkColorScheme } = useColorScheme();
  
  const tabBarStyle = {
    backgroundColor: isDarkColorScheme ? '#1E293B' : '#F8FAFC',
    borderTopColor: isDarkColorScheme ? '#334155' : '#F1F5F9',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 80 : 60,
  };

  const tabBarActiveTintColor = isDarkColorScheme ? '#4ADE80' : '#22C55E';
  const tabBarInactiveTintColor = isDarkColorScheme ? '#CBD5E1' : '#64748B';

  return (
    <Tabs
      screenOptions={{
        tabBarStyle,
        tabBarActiveTintColor,
        tabBarInactiveTintColor,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: isDarkColorScheme ? '#1E293B' : '#F8FAFC',
          borderBottomColor: isDarkColorScheme ? '#334155' : '#F1F5F9',
        },
        headerTintColor: isDarkColorScheme ? '#FAFAFA' : '#1E293B',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerTitle: 'Photograd-IA',
          headerRight: () => <ThemeToggle />,
          tabBarIcon: ({ color, size }) => (
            <Home className="text-current" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="escuelas"
        options={{
          title: 'Escuelas',
          headerTitle: 'Escuelas',
          headerRight: () => <ThemeToggle />,
          tabBarIcon: ({ color, size }) => (
            <GraduationCap className="text-current" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pagos"
        options={{
          title: 'Pagos',
          headerTitle: 'Pagos',
          headerRight: () => <ThemeToggle />,
          tabBarIcon: ({ color, size }) => (
            <CreditCard className="text-current" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          headerTitle: 'Perfil',
          headerRight: () => <ThemeToggle />,
          tabBarIcon: ({ color, size }) => (
            <User className="text-current" size={size} color={color} />
          ),
        }}
      />
      {/* Hide the escuela detail stack from tabs */}
      <Tabs.Screen
        name="escuela"
        options={{
          href: null, // This hides it from the tab bar
          headerShown: false, // Hide header from tabs, let Stack handle it
        }}
      />
    </Tabs>
  );
}