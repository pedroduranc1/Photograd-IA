import React from 'react';
import { View, Pressable } from 'react-native';
import { Users, Calendar, BookOpen, ChevronRight } from 'lucide-react-native';
import { Card } from './card';
import { Text } from './text';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';

export interface Grade {
  id: string;
  schoolId: string;
  name: string;
  level: string;
  academicYear: string;
  studentCount?: number;
  activeStudents?: number;
  createdAt: string;
  updatedAt: string;
}

interface GradeCardProps {
  grade: Grade;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function GradeCard({
  grade,
  onPress,
  onEdit,
  onDelete,
}: GradeCardProps) {
  const { isDarkColorScheme } = useColorScheme();
  const iconColor = isDarkColorScheme ? '#94A3B8' : '#64748B';

  return (
    <Card className="p-4 mb-3">
      <Pressable onPress={onPress} className="flex-1">
        {/* Header Row */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-lg font-semibold text-foreground mb-1">
              {grade.name}
            </Text>
            
            {/* Level */}
            <View className="flex-row items-center mb-2">
              <BookOpen size={14} color={iconColor} />
              <Text className="text-sm text-muted-foreground ml-1">
                {grade.level}
              </Text>
            </View>
          </View>
          
          <ChevronRight size={20} color={iconColor} />
        </View>

        {/* Academic Year */}
        <View className="flex-row items-center mb-3">
          <Calendar size={16} color={iconColor} />
          <Text className="text-sm text-muted-foreground ml-1">
            Año académico {grade.academicYear}
          </Text>
        </View>

        {/* Student Count */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Users size={16} color={iconColor} />
            <Text className="text-sm text-muted-foreground ml-1">
              {grade.studentCount || 0} estudiantes
            </Text>
          </View>
          
          {grade.activeStudents !== undefined && 
           grade.activeStudents !== grade.studentCount && (
            <Text className="text-sm text-green-600 dark:text-green-400 font-medium">
              {grade.activeStudents} activos
            </Text>
          )}
        </View>

        {/* Low enrollment warning */}
        {grade.studentCount !== undefined && grade.studentCount < 10 && (
          <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 mt-3">
            <Text className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Matrícula baja: Solo {grade.studentCount} estudiantes
            </Text>
          </View>
        )}
      </Pressable>
    </Card>
  );
}