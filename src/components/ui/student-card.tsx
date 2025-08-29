import React from 'react';
import { View, Pressable } from 'react-native';
import { User, Mail, Phone, Camera, CreditCard, ChevronRight, AlertCircle } from 'lucide-react-native';
import { Card } from './card';
import { Text } from './text';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';

export interface Student {
  id: string;
  schoolId: string;
  gradeId: string;
  firstName: string;
  lastName: string;
  studentId: string;
  email?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: 'active' | 'inactive' | 'graduated';
  enrollmentDate: string;
  graduationDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  fullName?: string;
  age?: number;
  photoCount?: number;
  paymentCount?: number;
  totalDebt?: number;
}

interface StudentCardProps {
  student: Student;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function StudentCard({
  student,
  onPress,
  onEdit,
  onDelete,
}: StudentCardProps) {
  const { isDarkColorScheme } = useColorScheme();
  const iconColor = isDarkColorScheme ? '#94A3B8' : '#64748B';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'inactive':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
      case 'graduated':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'graduated': return 'Graduado';
      default: return status;
    }
  };

  return (
    <Card className="p-4 mb-3">
      <Pressable onPress={onPress} className="flex-1">
        {/* Header Row */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-1">
              <Text className="text-lg font-semibold text-foreground flex-1">
                {student.fullName || `${student.firstName} ${student.lastName}`}
              </Text>
              <View 
                className={`px-2 py-1 rounded-full ${getStatusColor(student.status)}`}
              >
                <Text className={`text-xs font-medium ${getStatusColor(student.status).split(' ').pop()}`}>
                  {getStatusText(student.status)}
                </Text>
              </View>
            </View>
            
            {/* Student ID */}
            <View className="flex-row items-center mb-2">
              <User size={14} color={iconColor} />
              <Text className="text-sm text-muted-foreground ml-1">
                ID: {student.studentId}
              </Text>
              {student.age && (
                <Text className="text-sm text-muted-foreground ml-2">
                  • {student.age} años
                </Text>
              )}
            </View>
          </View>
          
          <ChevronRight size={20} color={iconColor} />
        </View>

        {/* Contact Info */}
        <View className="mb-3">
          {student.email && (
            <View className="flex-row items-center mb-1">
              <Mail size={14} color={iconColor} />
              <Text className="text-sm text-muted-foreground ml-1 flex-1" numberOfLines={1}>
                {student.email}
              </Text>
            </View>
          )}
          
          {student.phone && (
            <View className="flex-row items-center">
              <Phone size={14} color={iconColor} />
              <Text className="text-sm text-muted-foreground ml-1">
                {student.phone}
              </Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Camera size={16} color={iconColor} />
            <Text className="text-sm text-muted-foreground ml-1">
              {student.photoCount || 0} fotos
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <CreditCard size={16} color={iconColor} />
            <Text className="text-sm text-muted-foreground ml-1">
              {student.paymentCount || 0} pagos
            </Text>
          </View>
        </View>

        {/* Debt Warning */}
        {student.totalDebt && student.totalDebt > 0 && (
          <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
            <View className="flex-row items-center">
              <AlertCircle size={14} color="#DC2626" />
              <Text className="text-sm font-medium text-red-800 dark:text-red-200 ml-1">
                Deuda pendiente: ${student.totalDebt.toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Enrollment Date */}
        {student.enrollmentDate && (
          <View className="pt-2 border-t border-border mt-2">
            <Text className="text-xs text-muted-foreground">
              Inscrito desde: {new Date(student.enrollmentDate).toLocaleDateString('es-MX')}
            </Text>
          </View>
        )}
      </Pressable>
    </Card>
  );
}