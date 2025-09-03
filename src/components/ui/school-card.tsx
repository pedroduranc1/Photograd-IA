import React from 'react';
import { View, Pressable, Alert } from 'react-native';
import { MapPin, Users, Calendar, Phone, Mail, MoreVertical } from 'lucide-react-native';
import { Card } from './card';
import { Text } from './text';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';
import type { SchoolWithStats } from '~/src/types/database';

export interface School {
  id: string;
  name: string;
  location: string;
  address?: string;
  studentCount: number;
  nextGraduation?: string;
  status: 'active' | 'inactive';
  phone?: string;
  email?: string;
  debtAmount?: number;
  grades: string[];
}

// Legacy interface for compatibility
export type LegacySchool = School;
export type DatabaseSchool = SchoolWithStats;

interface SchoolCardProps {
  school: School;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCall?: () => void;
  onEmail?: () => void;
}

export function SchoolCard({
  school,
  onPress,
  onEdit,
  onDelete,
  onCall,
  onEmail,
}: SchoolCardProps) {
  const { isDarkColorScheme } = useColorScheme();
  const iconColor = isDarkColorScheme ? '#94A3B8' : '#64748B';

  const handleMoreActions = () => {
    Alert.alert(
      school.name,
      'Selecciona una acción',
      [
        { text: 'Ver Detalles', onPress: onPress },
        { text: 'Editar', onPress: onEdit },
        { text: 'Eliminar', onPress: onDelete, style: 'destructive' },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  return (
    <Card className="p-4 mb-3">
      <Pressable onPress={onPress} className="flex-1">
        {/* Header Row */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-1">
              <Text className="text-lg font-semibold text-foreground flex-1">
                {school.name}
              </Text>
              <View 
                className={`px-2 py-1 rounded-full ${
                  school.status === 'active' 
                    ? 'bg-green-100 dark:bg-green-900' 
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                <Text 
                  className={`text-xs font-medium ${
                    school.status === 'active' 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {school.status === 'active' ? 'Activa' : 'Inactiva'}
                </Text>
              </View>
            </View>
            
            {/* Location */}
            <View className="flex-row items-center mb-2">
              <MapPin size={14} color={iconColor} />
              <Text className="text-sm text-muted-foreground ml-1">
                {school.location}
              </Text>
            </View>
          </View>
          
          <Pressable onPress={handleMoreActions} className="p-1">
            <MoreVertical size={20} color={iconColor} />
          </Pressable>
        </View>

        {/* Info Row */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Users size={16} color={iconColor} />
            <Text className="text-sm text-muted-foreground ml-1">
              {school.studentCount} estudiantes
            </Text>
          </View>
          
          {school.nextGraduation && (
            <View className="flex-row items-center">
              <Calendar size={16} color={iconColor} />
              <Text className="text-sm text-muted-foreground ml-1">
                {school.nextGraduation}
              </Text>
            </View>
          )}
        </View>

        {/* Debt Warning */}
        {school.debtAmount && school.debtAmount > 0 && (
          <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 mb-3">
            <Text className="text-sm font-medium text-red-800 dark:text-red-200">
              Deuda pendiente: ${school.debtAmount.toLocaleString()}
            </Text>
          </View>
        )}

        {/* Grades */}
        <View className="flex-row flex-wrap mb-3">
          {school.grades.slice(0, 3).map((grade, index) => (
            <View key={grade} className="bg-muted rounded-full px-2 py-1 mr-2 mb-1">
              <Text className="text-xs text-muted-foreground">{grade}</Text>
            </View>
          ))}
          {school.grades.length > 3 && (
            <View className="bg-muted rounded-full px-2 py-1">
              <Text className="text-xs text-muted-foreground">
                +{school.grades.length - 3} más
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-2">
          {school.phone && (
            <Pressable
              onPress={onCall}
              className="flex-1 flex-row items-center justify-center h-9 rounded-md px-3 border border-input bg-background active:bg-accent"
            >
              <Phone size={14} color={iconColor} />
              <Text className="ml-1 text-sm">Llamar</Text>
            </Pressable>
          )}
          
          {school.email && (
            <Pressable
              onPress={onEmail}
              className="flex-1 flex-row items-center justify-center h-9 rounded-md px-3 border border-input bg-background active:bg-accent"
            >
              <Mail size={14} color={iconColor} />
              <Text className="ml-1 text-sm">Email</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Card>
  );
}