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
import { X, Save, User, Mail, Phone, MapPin, Calendar, Users, AlertCircle } from 'lucide-react-native';
import { Text } from './text';
import { Input } from './input';
import { Button } from './button';
import { Card } from './card';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';
import type { Student } from '~/src/types/database';

interface CreateStudentModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => void;
  schoolId: string;
  gradeId: string;
  isLoading?: boolean;
}

export function CreateStudentModal({
  visible,
  onClose,
  onSave,
  schoolId,
  gradeId,
  isLoading = false,
}: CreateStudentModalProps) {
  const { isDarkColorScheme } = useColorScheme();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setFormData({
        firstName: '',
        lastName: '',
        studentId: '',
        email: '',
        phone: '',
        address: '',
        birthDate: '',
        gender: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        notes: '',
      });
      setErrors({});
    }
  }, [visible]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'El número de estudiante es requerido';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      if (birthDate > today) {
        newErrors.birthDate = 'La fecha de nacimiento no puede ser futura';
      }
    }

    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = 'Teléfono debe tener al menos 10 dígitos';
    }

    if (formData.emergencyContactPhone && formData.emergencyContactPhone.length < 10) {
      newErrors.emergencyContactPhone = 'Teléfono debe tener al menos 10 dígitos';
    }

    // If emergency contact name is provided, phone should be provided too
    if (formData.emergencyContactName.trim() && !formData.emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = 'Teléfono de contacto de emergencia es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> = {
      schoolId,
      gradeId,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      studentId: formData.studentId.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
      birthDate: formData.birthDate.trim() || undefined,
      gender: formData.gender || undefined,
      emergencyContactName: formData.emergencyContactName.trim() || undefined,
      emergencyContactPhone: formData.emergencyContactPhone.trim() || undefined,
      status: 'active',
      enrollmentDate: new Date().toISOString().split('T')[0],
      notes: formData.notes.trim() || undefined,
    };

    onSave(studentData);
  };

  const handleClose = () => {
    // Check if form has changes
    const hasChanges = Object.values(formData).some(value => value.trim() !== '');

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
            Nuevo Estudiante
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
              <User size={20} color={iconColor} />
              <Text className="text-lg font-semibold text-foreground ml-2">
                Información Personal
              </Text>
            </View>
            
            <View className="space-y-4">
              <View className="flex-row space-x-2">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground mb-2">
                    Nombre *
                  </Text>
                  <Input
                    value={formData.firstName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                    placeholder="Juan"
                    className={errors.firstName ? 'border-red-500' : ''}
                    editable={!isLoading}
                  />
                  {errors.firstName && (
                    <Text className="text-red-500 text-sm mt-1">{errors.firstName}</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground mb-2">
                    Apellido *
                  </Text>
                  <Input
                    value={formData.lastName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                    placeholder="Pérez"
                    className={errors.lastName ? 'border-red-500' : ''}
                    editable={!isLoading}
                  />
                  {errors.lastName && (
                    <Text className="text-red-500 text-sm mt-1">{errors.lastName}</Text>
                  )}
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Número de Estudiante *
                </Text>
                <Input
                  value={formData.studentId}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, studentId: text }))}
                  placeholder="EST001, 2024001, etc."
                  className={errors.studentId ? 'border-red-500' : ''}
                  editable={!isLoading}
                />
                {errors.studentId && (
                  <Text className="text-red-500 text-sm mt-1">{errors.studentId}</Text>
                )}
                <Text className="text-xs text-muted-foreground mt-1">
                  Identificador único del estudiante
                </Text>
              </View>

              <View className="flex-row space-x-2">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground mb-2">
                    Fecha de Nacimiento
                  </Text>
                  <View className="flex-row items-center">
                    <Calendar size={20} color={iconColor} />
                    <Input
                      className={`flex-1 ml-2 ${errors.birthDate ? 'border-red-500' : ''}`}
                      value={formData.birthDate}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, birthDate: text }))}
                      placeholder="YYYY-MM-DD"
                      editable={!isLoading}
                    />
                  </View>
                  {errors.birthDate && (
                    <Text className="text-red-500 text-sm mt-1">{errors.birthDate}</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground mb-2">
                    Género
                  </Text>
                  <View className="flex-row space-x-2">
                    <Pressable
                      onPress={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                      disabled={isLoading}
                      className={`flex-1 p-2 border rounded-md ${formData.gender === 'male' ? 'border-primary bg-primary/10' : 'border-input'}`}
                    >
                      <Text className={`text-sm text-center ${formData.gender === 'male' ? 'text-primary' : 'text-muted-foreground'}`}>
                        Masculino
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                      disabled={isLoading}
                      className={`flex-1 p-2 border rounded-md ${formData.gender === 'female' ? 'border-primary bg-primary/10' : 'border-input'}`}
                    >
                      <Text className={`text-sm text-center ${formData.gender === 'female' ? 'text-primary' : 'text-muted-foreground'}`}>
                        Femenino
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Contact Information */}
          <Card className="p-4 mb-4">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Información de Contacto
            </Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Email
                </Text>
                <View className="flex-row items-center">
                  <Mail size={20} color={iconColor} />
                  <Input
                    className={`flex-1 ml-2 ${errors.email ? 'border-red-500' : ''}`}
                    value={formData.email}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                    placeholder="estudiante@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>
                {errors.email && (
                  <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>
                )}
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Teléfono
                </Text>
                <View className="flex-row items-center">
                  <Phone size={20} color={iconColor} />
                  <Input
                    className={`flex-1 ml-2 ${errors.phone ? 'border-red-500' : ''}`}
                    value={formData.phone}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                    placeholder="(55) 1234-5678"
                    keyboardType="phone-pad"
                    editable={!isLoading}
                  />
                </View>
                {errors.phone && (
                  <Text className="text-red-500 text-sm mt-1">{errors.phone}</Text>
                )}
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Dirección
                </Text>
                <View className="flex-row items-start">
                  <MapPin size={20} color={iconColor} />
                  <Input
                    className="flex-1 ml-2"
                    value={formData.address}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                    placeholder="Calle, Colonia, Ciudad..."
                    multiline
                    numberOfLines={2}
                    editable={!isLoading}
                  />
                </View>
              </View>
            </View>
          </Card>

          {/* Emergency Contact */}
          <Card className="p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <AlertCircle size={20} color={iconColor} />
              <Text className="text-lg font-semibold text-foreground ml-2">
                Contacto de Emergencia
              </Text>
            </View>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Nombre del Contacto
                </Text>
                <View className="flex-row items-center">
                  <Users size={20} color={iconColor} />
                  <Input
                    className="flex-1 ml-2"
                    value={formData.emergencyContactName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyContactName: text }))}
                    placeholder="María Pérez (Madre)"
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Teléfono de Emergencia
                </Text>
                <View className="flex-row items-center">
                  <Phone size={20} color={iconColor} />
                  <Input
                    className={`flex-1 ml-2 ${errors.emergencyContactPhone ? 'border-red-500' : ''}`}
                    value={formData.emergencyContactPhone}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyContactPhone: text }))}
                    placeholder="(55) 9876-5432"
                    keyboardType="phone-pad"
                    editable={!isLoading}
                  />
                </View>
                {errors.emergencyContactPhone && (
                  <Text className="text-red-500 text-sm mt-1">{errors.emergencyContactPhone}</Text>
                )}
              </View>
            </View>
          </Card>

          {/* Additional Notes */}
          <Card className="p-4 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Notas Adicionales
            </Text>
            
            <View>
              <Input
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                placeholder="Alergias, medicamentos, observaciones especiales..."
                multiline
                numberOfLines={4}
                editable={!isLoading}
              />
              <Text className="text-xs text-muted-foreground mt-1">
                Información importante sobre el estudiante (opcional)
              </Text>
            </View>
          </Card>

          {/* Info Card */}
          <Card className="p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <View className="flex-row items-start">
              <View className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full mr-3 mt-1">
                <User size={16} color={isDarkColorScheme ? '#4ADE80' : '#22C55E'} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                  Información importante
                </Text>
                <Text className="text-xs text-green-600 dark:text-green-400">
                  El estudiante será registrado como activo y podrá acceder a todos los servicios de la escuela. 
                  Los campos marcados con * son obligatorios.
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}