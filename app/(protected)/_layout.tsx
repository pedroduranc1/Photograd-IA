import React from 'react';
import { Stack } from 'expo-router';
import { ThemeToggle } from '../../src/components/layout/ThemeToggle';

export default function ProtectedLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Photograd-IA',
          headerRight: () => <ThemeToggle />,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerRight: () => <ThemeToggle />,
        }}
      />
    </Stack>
  );
}