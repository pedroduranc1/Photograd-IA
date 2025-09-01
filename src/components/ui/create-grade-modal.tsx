import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { X, Save, GraduationCap, Calendar, BookOpen } from 'lucide-react-native';
import { Text } from './text';
import { Input } from './input';
import { Button } from './button';
import { Card } from './card';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';
import type { Grade } from '~/src/types/database';

interface CreateGradeModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (grade: Omit<Grade, 'id' | 'createdAt' | 'updatedAt'>) => void;
  schoolId: string;
  isLoading?: boolean;
}

export function CreateGradeModal({
  visible,
  onClose,
  onSave,
  schoolId,
  isLoading = false,
}: CreateGradeModalProps) {
  const { isDarkColorScheme } = useColorScheme();
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    academicYear: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setFormData({
        name: '',
        level: '',
        academicYear: new Date().getFullYear().toString(),
      });
      setErrors({});
    }
  }, [visible]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del grado es requerido';
    }

    if (!formData.level.trim()) {
      newErrors.level = 'El nivel es requerido';
    }

    if (!formData.academicYear.trim()) {
      newErrors.academicYear = 'El año académico es requerido';
    } else {
      const year = parseInt(formData.academicYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear + 10) {
        newErrors.academicYear = 'Año académico inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const gradeData: Omit<Grade, 'id' | 'createdAt' | 'updatedAt'> = {
      schoolId,
      name: formData.name.trim(),
      level: formData.level.trim(),
      academicYear: formData.academicYear.trim(),
    };

    onSave(gradeData);
  };

  const handleClose = () => {
    // Check if form has changes
    const hasChanges = Object.values(formData).some(value => value.trim() !== '' && value !== new Date().getFullYear().toString());

    if (hasChanges) {
      Alert.alert(
        'Descartar cambios',
        '¿Estás seguro de que quieres descartar los cambios?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  const iconColor = isDarkColorScheme ? '#94A3B8' : '#64748B';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border bg-background">
          <Pressable onPress={handleClose} className="p-2" disabled={isLoading}>
            <X size={24} color={iconColor} />
          </Pressable>
          
          <Text className="text-lg font-semibold text-foreground">
            Nuevo Grado
          </Text>
          
          <Button onPress={handleSave} size="sm" disabled={isLoading}>
            <View className="flex-row items-center">
              <Save size={16} color="white" />
              <Text className="ml-1 text-white font-medium">
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Text>
            </View>
          </Button>
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <Card className="p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <GraduationCap size={20} color={iconColor} />
              <Text className="text-lg font-semibold text-foreground ml-2">
                Información del Grado
              </Text>
            </View>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Nombre del Grado *
                </Text>
                <Input
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Ej. 1° de Primaria, Preescolar A, Secundaria 2°"
                  className={errors.name ? 'border-red-500' : ''}
                  editable={!isLoading}
                />
                {errors.name && (
                  <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>
                )}
                <Text className="text-xs text-muted-foreground mt-1">
                  Nombre descriptivo del grado o clase
                </Text>
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Nivel Educativo *
                </Text>
                <View className="flex-row items-center">
                  <BookOpen size={20} color={iconColor} />
                  <Input
                    className={`flex-1 ml-2 ${errors.level ? 'border-red-500' : ''}`}
                    value={formData.level}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, level: text }))}
                    placeholder="Ej. Preescolar, Primaria, Secundaria"
                    editable={!isLoading}
                  />
                </View>
                {errors.level && (
                  <Text className="text-red-500 text-sm mt-1">{errors.level}</Text>
                )}
                <Text className="text-xs text-muted-foreground mt-1">
                  Nivel educativo al que pertenece el grado
                </Text>
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Año Académico *
                </Text>
                <View className="flex-row items-center">
                  <Calendar size={20} color={iconColor} />
                  <Input
                    className={`flex-1 ml-2 ${errors.academicYear ? 'border-red-500' : ''}`}
                    value={formData.academicYear}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, academicYear: text }))}
                    placeholder="2024"
                    keyboardType="numeric"
                    maxLength={4}
                    editable={!isLoading}
                  />
                </View>
                {errors.academicYear && (
                  <Text className="text-red-500 text-sm mt-1">{errors.academicYear}</Text>
                )}
                <Text className="text-xs text-muted-foreground mt-1">
                  Año del ciclo académico actual
                </Text>
              </View>
            </View>
          </Card>

          {/* Info Card */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <View className="flex-row items-start">
              <View className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full mr-3 mt-1">
                <GraduationCap size={16} color={isDarkColorScheme ? '#60A5FA' : '#3B82F6'} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Información importante
                </Text>
                <Text className="text-xs text-blue-600 dark:text-blue-400">
                  Una vez creado el grado, podrás agregar estudiantes y gestionar la información académica. 
                  El año académico ayuda a organizar los registros por ciclo escolar.
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}