import React from 'react';
import { View, ScrollView, Pressable, Linking } from 'react-native';
import {
  MapPin,
  Phone,
  Mail,
  Users,
  Calendar,
  DollarSign,
  GraduationCap,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react-native';
import { Card } from './card';
import { Text } from './text';
import { Button } from './button';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';
import type { School } from './school-card';

interface SchoolDetailProps {
  school: School;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
}

export function SchoolDetail({
  school,
  onEdit,
  onDelete,
  onBack,
}: SchoolDetailProps) {
  const { isDarkColorScheme } = useColorScheme();
  const iconColor = isDarkColorScheme ? '#94A3B8' : '#64748B';

  const handleCall = () => {
    if (school.phone) {
      Linking.openURL(`tel:${school.phone}`);
    }
  };

  const handleEmail = () => {
    if (school.email) {
      Linking.openURL(`mailto:${school.email}`);
    }
  };

  const handleMapOpen = () => {
    if (school.address) {
      const query = encodeURIComponent(school.address);
      Linking.openURL(`https://maps.google.com/?q=${query}`);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View className="p-6 bg-primary">
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1 mr-4">
            <Text className="text-2xl font-bold text-primary-foreground mb-2">
              {school.name}
            </Text>
            <View className="flex-row items-center">
              <MapPin size={16} color="rgba(255,255,255,0.8)" />
              <Text className="text-primary-foreground/80 ml-1">
                {school.location}
              </Text>
            </View>
          </View>
          
          <View 
            className={`px-3 py-1 rounded-full ${
              school.status === 'active' 
                ? 'bg-green-100 dark:bg-green-900' 
                : 'bg-gray-100 dark:bg-gray-800'
            }`}
          >
            <Text 
              className={`text-sm font-medium ${
                school.status === 'active' 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {school.status === 'active' ? 'Activa' : 'Inactiva'}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row justify-between">
          <View className="flex-1 items-center">
            <Users size={24} color="rgba(255,255,255,0.8)" />
            <Text className="text-primary-foreground/80 text-sm mt-1">
              {school.studentCount}
            </Text>
            <Text className="text-primary-foreground/60 text-xs">
              Estudiantes
            </Text>
          </View>
          
          <View className="flex-1 items-center">
            <GraduationCap size={24} color="rgba(255,255,255,0.8)" />
            <Text className="text-primary-foreground/80 text-sm mt-1">
              {school.grades.length}
            </Text>
            <Text className="text-primary-foreground/60 text-xs">
              Niveles
            </Text>
          </View>
          
          {school.debtAmount !== undefined && (
            <View className="flex-1 items-center">
              <DollarSign size={24} color="rgba(255,255,255,0.8)" />
              <Text className="text-primary-foreground/80 text-sm mt-1">
                ${school.debtAmount.toLocaleString()}
              </Text>
              <Text className="text-primary-foreground/60 text-xs">
                {school.debtAmount > 0 ? 'Deuda' : 'Al día'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="p-4 space-y-4">
        {/* Debt Alert */}
        {school.debtAmount && school.debtAmount > 0 && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <View className="flex-row items-center">
              <DollarSign size={20} color="#DC2626" />
              <Text className="text-red-800 dark:text-red-200 font-medium ml-2">
                Deuda Pendiente: ${school.debtAmount.toLocaleString()}
              </Text>
            </View>
            <Text className="text-red-700 dark:text-red-300 text-sm mt-1">
              Contactar para resolver el pago pendiente
            </Text>
          </Card>
        )}

        {/* Contact Information */}
        <Card className="p-4">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Información de Contacto
          </Text>
          
          <View className="space-y-3">
            {school.address && (
              <Pressable
                onPress={handleMapOpen}
                className="flex-row items-center justify-between py-2"
              >
                <View className="flex-row items-center flex-1">
                  <MapPin size={20} color={iconColor} />
                  <Text className="text-foreground ml-3 flex-1">
                    {school.address}
                  </Text>
                </View>
                <ExternalLink size={16} color={iconColor} />
              </Pressable>
            )}
            
            {school.phone && (
              <Pressable
                onPress={handleCall}
                className="flex-row items-center justify-between py-2"
              >
                <View className="flex-row items-center flex-1">
                  <Phone size={20} color={iconColor} />
                  <Text className="text-foreground ml-3">
                    {school.phone}
                  </Text>
                </View>
                <ExternalLink size={16} color={iconColor} />
              </Pressable>
            )}
            
            {school.email && (
              <Pressable
                onPress={handleEmail}
                className="flex-row items-center justify-between py-2"
              >
                <View className="flex-row items-center flex-1">
                  <Mail size={20} color={iconColor} />
                  <Text className="text-foreground ml-3">
                    {school.email}
                  </Text>
                </View>
                <ExternalLink size={16} color={iconColor} />
              </Pressable>
            )}
          </View>
        </Card>

        {/* Academic Information */}
        <Card className="p-4">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Información Académica
          </Text>
          
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Grados/Niveles Educativos
            </Text>
            <View className="flex-row flex-wrap">
              {school.grades.map((grade, index) => (
                <View key={grade} className="bg-muted rounded-full px-3 py-1 mr-2 mb-2">
                  <Text className="text-sm text-muted-foreground">{grade}</Text>
                </View>
              ))}
            </View>
          </View>

          {school.nextGraduation && (
            <View className="flex-row items-center">
              <Calendar size={20} color={iconColor} />
              <View className="ml-3">
                <Text className="text-sm font-medium text-foreground">
                  Próxima Graduación
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {school.nextGraduation}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Recent Activity */}
        <Card className="p-4">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Actividad Reciente
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-3" />
              <View className="flex-1">
                <Text className="text-sm text-foreground">
                  Última actualización de datos
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Hace 2 días
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
              <View className="flex-1">
                <Text className="text-sm text-foreground">
                  Registro de nuevo evento
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Hace 1 semana
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-orange-500 mr-3" />
              <View className="flex-1">
                <Text className="text-sm text-foreground">
                  Contacto inicial establecido
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Hace 2 semanas
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View className="flex-row space-x-3 mb-6">
          <Button
            onPress={onEdit}
            variant="outline"
            className="flex-1"
          >
            <View className="flex-row items-center">
              <Edit size={16} color={iconColor} />
              <Text className="ml-2">Editar</Text>
            </View>
          </Button>
          
          <Button
            onPress={onDelete}
            variant="outline"
            className="flex-1 border-red-200 dark:border-red-800"
          >
            <View className="flex-row items-center">
              <Trash2 size={16} color="#DC2626" />
              <Text className="ml-2 text-red-600 dark:text-red-400">Eliminar</Text>
            </View>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}