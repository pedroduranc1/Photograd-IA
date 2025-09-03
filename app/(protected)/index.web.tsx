import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '~/src/components/ui/button';
import { Text } from '~/src/components/ui/text';
import { Card } from '~/src/components/ui/card';
import { useAuthUser } from '~/src/store/auth-store';
import { useUserProfile } from '~/src/hooks/data/use-user-profile';
import { GraduationCap } from '~/src/components/ui/icons/GraduationCap';
import { CreditCard } from '~/src/components/ui/icons/CreditCard';
import { User } from '~/src/components/ui/icons/User';

export default function HomeScreenWeb() {
  const router = useRouter();
  const authUser = useAuthUser();
  const { data: profile, isLoading } = useUserProfile();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const displayName = profile?.firstName 
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : authUser?.email?.split('@')[0] || 'Usuario';

  const quickActions = [
    {
      title: 'Gestionar Escuelas',
      description: 'Ver y administrar escuelas asociadas',
      icon: GraduationCap,
      route: '/(protected)/escuelas',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Pagos',
      description: 'Revisar el estado de pagos',
      icon: CreditCard,
      route: '/(protected)/pagos',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Mi Perfil',
      description: 'Actualizar información personal',
      icon: User,
      route: '/(protected)/perfil',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        {/* Welcome Header */}
        <View className="mb-8">
          <Text className="text-4xl font-bold text-foreground mb-2">
            {getGreeting()}, {displayName}!
          </Text>
          <Text className="text-lg text-muted-foreground">
            Bienvenido a Photograd-IA. Panel de control principal
          </Text>
        </View>

        {/* Stats Cards Grid */}
        <View className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                0
              </Text>
              <View className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-full">
                <GraduationCap size={24} className="text-blue-600 dark:text-blue-400" />
              </View>
            </View>
            <Text className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              Escuelas Registradas
            </Text>
            <Text className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Total de escuelas asociadas
            </Text>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
                0
              </Text>
              <View className="p-3 bg-green-100 dark:bg-green-800/30 rounded-full">
                <User size={24} className="text-green-600 dark:text-green-400" />
              </View>
            </View>
            <Text className="text-sm text-green-700 dark:text-green-300 font-medium">
              Estudiantes
            </Text>
            <Text className="text-xs text-green-600 dark:text-green-400 mt-1">
              Total de estudiantes registrados
            </Text>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                $0
              </Text>
              <View className="p-3 bg-purple-100 dark:bg-purple-800/30 rounded-full">
                <CreditCard size={24} className="text-purple-600 dark:text-purple-400" />
              </View>
            </View>
            <Text className="text-sm text-purple-700 dark:text-purple-300 font-medium">
              Ingresos del Mes
            </Text>
            <Text className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Facturación mensual
            </Text>
          </Card>
        </View>

        {/* Quick Actions Grid */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-foreground mb-6">
            Acciones Rápidas
          </Text>
          <View className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => router.push(action.route)}
                  className="block"
                  accessibilityRole="button"
                  accessibilityLabel={action.title}
                >
                  <Card className={`p-6 hover:shadow-lg transition-shadow ${action.bgColor} border-0`}>
                    <View className="flex-row items-start">
                      <View className={`p-3 rounded-full ${action.color.includes('blue') ? 'bg-blue-100 dark:bg-blue-800/30' : action.color.includes('green') ? 'bg-green-100 dark:bg-green-800/30' : 'bg-purple-100 dark:bg-purple-800/30'} mr-4`}>
                        <IconComponent size={24} className={action.color} />
                      </View>
                      <View className="flex-1">
                        <Text className={`text-lg font-semibold ${action.color} mb-2`}>
                          {action.title}
                        </Text>
                        <Text className={`text-sm ${action.color.replace('600', '700').replace('400', '300')}`}>
                          {action.description}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-foreground mb-6">
            Actividad Reciente
          </Text>
          <Card className="p-6">
            <View className="flex-row items-center justify-center py-8">
              <View className="text-center">
                <Text className="text-6xl mb-4">📊</Text>
                <Text className="text-lg font-semibold text-foreground mb-2">
                  No hay actividad reciente
                </Text>
                <Text className="text-muted-foreground">
                  La actividad de tu cuenta aparecerá aquí
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Photo Processing Section */}
        <View>
          <Text className="text-2xl font-bold text-foreground mb-6">
            Procesamiento de Fotos
          </Text>
          <Card className="p-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <View className="text-center">
              <Text className="text-4xl mb-4">📸</Text>
              <Text className="text-xl font-semibold text-foreground mb-2">
                ¿Listo para procesar fotos?
              </Text>
              <Text className="text-muted-foreground mb-6">
                Sube fotos para mejorar su calidad con IA
              </Text>
              <View className="flex-row justify-center space-x-4">
                <Button
                  onPress={() => {
                    // TODO: Navigate to photo upload screen
                    alert('Función de subida de fotos próximamente');
                  }}
                  className="px-8"
                >
                  <Text className="text-primary-foreground font-medium">
                    Subir Foto
                  </Text>
                </Button>
                
                <Button
                  onPress={() => {
                    // TODO: Navigate to gallery screen
                    alert('Función de galería próximamente');
                  }}
                  variant="outline"
                  className="px-8"
                >
                  <Text>Ver Galería</Text>
                </Button>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}