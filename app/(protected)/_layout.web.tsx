import React, { useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { Sidebar } from '~/src/components/layout/Sidebar';
import { Header } from '~/src/components/layout/Header';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';

export default function ProtectedLayoutWeb() {
  const { isDarkColorScheme } = useColorScheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const backgroundClass = isDarkColorScheme ? 'bg-slate-950' : 'bg-slate-50';

  return (
    <View className={`flex-1 flex-row ${backgroundClass}`}>
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      
      {/* Main Content Area */}
      <View className="flex-1 flex-col">
        {/* Header */}
        <Header showBreadcrumbs={true} />
        
        {/* Page Content */}
        <View className="flex-1 overflow-hidden">
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              animationDuration: 150,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="escuelas" />
            <Stack.Screen name="pagos" />
            <Stack.Screen name="perfil" />
            <Stack.Screen name="escuelas/[schoolId]" />
            <Stack.Screen name="escuelas/[schoolId]/grados/[gradeId]" />
            <Stack.Screen name="escuelas/[schoolId]/grados/[gradeId]/estudiante/[studentId]" />
          </Stack>
        </View>
      </View>
    </View>
  );
}