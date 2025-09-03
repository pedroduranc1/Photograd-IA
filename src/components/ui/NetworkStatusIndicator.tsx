import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNetworkStatus } from '~/src/hooks/useNetworkStatus';

interface NetworkStatusIndicatorProps {
  showDiagnostics?: boolean;
}

export function NetworkStatusIndicator({ showDiagnostics = false }: NetworkStatusIndicatorProps) {
  const { status, isLoading, checkNetwork, runDiagnostics, canUseCRUD } = useNetworkStatus();

  if (isLoading) {
    return (
      <View className="flex-row items-center p-2 bg-muted rounded-lg">
        <Text className="text-muted-foreground text-sm">Verificando conectividad...</Text>
      </View>
    );
  }

  if (!status) {
    return null;
  }

  const getStatusColor = () => {
    if (!status.isConnected) return 'bg-destructive';
    if (!status.canReachTurso) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!status.isConnected) return '❌ Sin conexión';
    if (!status.canReachTurso) return '⚠️ BD no disponible';
    return '✅ Conectado';
  };

  const getStatusMessage = () => {
    if (!status.isConnected) {
      return 'No hay conexión a internet';
    }
    if (!status.canReachTurso) {
      return 'Base de datos no accesible - CRUD no funcionará';
    }
    return 'Todo funcionando correctamente';
  };

  const handleDiagnostics = async () => {
    const report = await runDiagnostics();
    console.log(report);
    // En una implementación real, podrías mostrar esto en un modal
    alert(report);
  };

  // Only show warning/error states to avoid cluttering the UI
  if (canUseCRUD) {
    return null;
  }

  return (
    <View className="p-3 m-2 rounded-lg border border-orange-200 bg-orange-50">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <View className={`w-2 h-2 rounded-full mr-2 ${getStatusColor()}`} />
            <Text className="font-medium text-sm">{getStatusText()}</Text>
          </View>
          
          <Text className="text-xs text-muted-foreground">
            {getStatusMessage()}
          </Text>
          
          {status.error && (
            <Text className="text-xs text-destructive mt-1">
              {status.error}
            </Text>
          )}
        </View>

        <View className="flex-row space-x-2">
          <Pressable 
            onPress={checkNetwork}
            className="px-3 py-1 bg-primary rounded"
          >
            <Text className="text-primary-foreground text-xs">Reintentar</Text>
          </Pressable>

          {showDiagnostics && (
            <Pressable 
              onPress={handleDiagnostics}
              className="px-3 py-1 bg-secondary rounded"
            >
              <Text className="text-secondary-foreground text-xs">Diagnosticar</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}