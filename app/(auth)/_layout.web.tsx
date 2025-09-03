import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { Text } from '~/src/components/ui/text';
import { ThemeToggle } from '~/src/components/layout/ThemeToggle';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';

export default function AuthLayoutWeb() {
  const { isDarkColorScheme } = useColorScheme();
  
  const backgroundClass = isDarkColorScheme ? 'bg-slate-950' : 'bg-slate-50';

  return (
    <View className={`flex-1 ${backgroundClass}`}>
      {/* Header */}
      <View className={`${isDarkColorScheme ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border-b px-6 py-4`}>
        <View className="flex-row items-center justify-between max-w-7xl mx-auto w-full">
          <Text className="text-2xl font-bold text-foreground">
            Photograd-IA
          </Text>
          <ThemeToggle />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 flex-row">
        {/* Left Side - Branding/Info */}
        <View className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30">
          <View className="max-w-md text-center">
            <Text className="text-4xl mb-4">📸</Text>
            <Text className="text-3xl font-bold text-foreground mb-4">
              Bienvenido a Photograd-IA
            </Text>
            <Text className="text-lg text-muted-foreground mb-6">
              La plataforma integral para la gestión de fotografía escolar con inteligencia artificial
            </Text>
            <View className="space-y-4">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                <Text className="text-muted-foreground">Gestión de escuelas y estudiantes</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                <Text className="text-muted-foreground">Procesamiento con IA</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                <Text className="text-muted-foreground">Control de pagos y facturación</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right Side - Auth Forms */}
        <View className="flex-1 lg:w-1/2 flex items-center justify-center p-8">
          <View className="w-full max-w-md">
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                animationDuration: 200,
              }}
            >
              <Stack.Screen name="sign-in" />
              <Stack.Screen name="sign-up" />
              <Stack.Screen name="forgot-password" />
            </Stack>
          </View>
        </View>
      </View>
    </View>
  );
}